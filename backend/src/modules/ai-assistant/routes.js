import { Router } from 'express';
import { env } from '../../config/env.js';
import { AppError, sendSuccess } from '../../middleware/apiResponse.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { makeSystemPrompt } from './knowledge/prompts.js';
import { findRelevantReferences, formatReferencesForPrompt, toReferenceLinks } from './knowledge/referenceLibrary.js';
import { makeReferenceFallback } from './knowledge/referenceAnswers.js';
import { faqReferenceLinks, findFaq, formatFaqForPrompt } from './knowledge/faqLibrary.js';

const router = Router();
const MAX_HISTORY = 10;
const MAX_QUESTION_LENGTH = 3000;
const MAX_LUMEN_MESSAGE_LENGTH = 3900;
const ALLOWED_ROLES = new Set(['user', 'assistant']);
const configuredChatOrigin = (process.env.LUMEN_CHAT_ORIGIN || process.env.VITE_APIM_ORIGIN || '').trim();
const chatOrigin = configuredChatOrigin && !/^https?:\/\//i.test(configuredChatOrigin)
  ? `https://${configuredChatOrigin}`
  : configuredChatOrigin;
const configuredInstanceId = (process.env.LUMEN_INSTANCE_ID || '').trim();
// Lumen AI Chat contract: see ./ai-chat-openapi.yaml (list instances -> open session -> send message).
// Session errors from the spec that mean "open a new session"; none of them charge credits.
const STALE_SESSION_CODES = new Set([
  'SESSION_NOT_OWNED',
  'SESSION_NOT_FOR_INSTANCE',
  'AI_CHAT_SESSION_NOT_FOUND',
  'AI_CHAT_SESSION_ID_INVALID',
  'AI_CHAT_CONFLICT',
]);

// ---- Lumen HTTP client ----

const lumenHeaders = () => ({
  'Content-Type': 'application/json',
  'lumen-api-key': env.lumen.apiKey,
  'lumen-api-secret': env.lumen.apiSecret,
});

const isAbort = (error) => error?.name === 'TimeoutError' || error?.name === 'AbortError';
const stageCode = (stage) => `LUMEN_${stage.toUpperCase().replaceAll(' ', '_')}`;

// Lumen statuses passed through as-is; anything else becomes 502.
const PASSTHROUGH_STATUSES = new Set([400, 403, 404, 409, 429, 502, 503, 504]);
const PROVIDER_CODE = /^[\w-]{1,80}$/;
const HTTP_MESSAGES = {
  400: (stage) => `Lumen rejected the ${stage} request. Check the endpoint and request format.`,
  403: () => 'Lumen refused the request. Check the AI Chat grant and available API credits.',
  404: () => 'The configured Lumen chat instance was not found.',
  504: () => 'Lumen took too long to answer. Please try again.',
};

const httpErrorMessage = (status, stage) =>
  HTTP_MESSAGES[status]?.(stage) ?? `Lumen returned HTTP ${status} during ${stage}. Check the Lumen gateway and service status.`;

// Lumen's own error code when it is safe to echo, else a stage-specific one.
const providerErrorCode = (data, status, stage) => {
  const code = data?.code || data?.error?.code || data?.errorCode;
  return typeof code === 'string' && PROVIDER_CODE.test(code) ? code : `${stageCode(stage)}_HTTP_${status}`;
};

const networkError = (error, stage) =>
  isAbort(error)
    ? new AppError(`Lumen timed out during ${stage}. Please try again.`, 504, `${stageCode(stage)}_TIMEOUT`)
    : new AppError(`Could not connect to Lumen during ${stage}. Check the gateway origin and try again.`, 502, `${stageCode(stage)}_CONNECTION_ERROR`);

const requestLumen = async (url, options = {}, stage = 'request') => {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { ...lumenHeaders(), ...options.headers },
      signal: AbortSignal.timeout(27000),
    });
  } catch (error) {
    throw networkError(error, stage);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const status = PASSTHROUGH_STATUSES.has(response.status) ? response.status : 502;
    throw new AppError(httpErrorMessage(response.status, stage), status, providerErrorCode(data, response.status, stage));
  }
  return data;
};

// ---- Answers, notices and fallbacks ----

const FAQ_NOTICES = {
  declined: {
    English: 'Lumen could not answer this one, so this answer comes from Earnest’s reviewed FAQ.',
    Filipino: 'Hindi ito nasagot ng Lumen, kaya ang sagot na ito ay mula sa sinuring FAQ ng Earnest.',
    Taglish: 'Hindi ito nasagot ng Lumen, kaya galing ang sagot na ito sa reviewed FAQ ng Earnest.',
  },
  unavailable: {
    English: 'Lumen AI is unavailable right now, so this answer comes from Earnest’s reviewed FAQ.',
    Filipino: 'Hindi available ang Lumen AI ngayon, kaya ang sagot na ito ay mula sa sinuring FAQ ng Earnest.',
    Taglish: 'Hindi available ang Lumen AI ngayon, kaya galing ang sagot na ito sa reviewed FAQ ng Earnest.',
  },
};

const STANDARD_CAUTIONS = [
  'AI-generated or reference-based information may be incomplete. Verify important payroll details with your records and current official guidance.',
  'This is general information, not legal advice. A deduction or employment term cannot be judged from this chat alone.',
];

// Phrases Lumen uses when it refuses or cannot answer a question.
const DECLINED_PATTERNS = [
  /outside.*covers/i,
  /\bi['’]?m (?:sorry|unable)[^.]{0,60}\b(?:help|assist|answer)/i,
  /\bi (?:can(?:no|['’])t|am unable to|am not able to) (?:help|assist|answer|provide)/i,
];
const isDeclinedAnswer = (answer) => DECLINED_PATTERNS.some((pattern) => pattern.test(answer));

// Answer from the reviewed FAQ library (used when Lumen declines or is unavailable).
const sendFaqAnswer = (res, { faq, language, reason, sessionId }) =>
  sendSuccess(res, {
    answer: faq.answer[language] || faq.answer.English,
    sessionId: sessionId || null,
    source: 'faq',
    cautions: [FAQ_NOTICES[reason][language] || FAQ_NOTICES[reason].English, ...STANDARD_CAUTIONS],
    references: faqReferenceLinks(faq),
  }, 'Assistant response generated');

// Lumen failures (not user input errors) can fall back to the FAQ.
const isLumenFailure = (error) =>
  error?.code !== 'QUESTION_TOO_LONG'
  && (error?.statusCode >= 500 || /^(LUMEN_|AI_)/.test(String(error?.code || '')) || isAbort(error));

const isTimeout = (error) => isAbort(error) || error?.code === 'AI_CHAT_REPLY_TIMEOUT';

const validateChat = (req) => {
  const errors = {};
  const { question, language = 'English', history = [], topic = 'labor' } = req.body || {};
  if (typeof question !== 'string' || !question.trim()) errors.question = 'Enter a question.';
  else if (question.trim().length > MAX_QUESTION_LENGTH) errors.question = 'Question must be 3,000 characters or fewer.';
  if (!['English', 'Filipino', 'Taglish'].includes(language)) errors.language = 'Choose English, Filipino, or Taglish.';
  if (!['labor', 'payslip', 'contract'].includes(topic)) errors.topic = 'Choose a supported question type.';
  if (!Array.isArray(history) || history.length > MAX_HISTORY) errors.history = 'Conversation history is invalid.';
  else if (history.some((item) => !item || !ALLOWED_ROLES.has(item.role) || typeof item.content !== 'string' || item.content.length > 4000)) {
    errors.history = 'Conversation history is invalid.';
  }
  return errors;
};

// ---- Chat flow steps ----

const MISCONFIGURED = 'AI chat is not configured correctly. Please contact the project team.';
const notConfigured = (message) => new AppError(message, 503, 'AI_NOT_CONFIGURED');

// Validated base URL of the Lumen AI Chat API (".../ai_chat/").
const chatBaseUrl = () => {
  if (!chatOrigin || !env.lumen.apiKey || !env.lumen.apiSecret) {
    throw notConfigured('AI chat is not configured yet. Set the Lumen gateway origin and credentials in the backend environment.');
  }
  let origin;
  try {
    origin = new URL(chatOrigin);
  } catch {
    throw notConfigured(MISCONFIGURED);
  }
  if (!['https:', 'http:'].includes(origin.protocol)) throw notConfigured(MISCONFIGURED);
  return new URL('/ai_chat/', origin);
};

// LUMEN_INSTANCE_ID when set, otherwise the first instance whose status allows sessions.
const findInstanceId = async (base) => {
  const instances = await requestLumen(new URL('instances', base), {}, 'instance lookup');
  const available = Array.isArray(instances?.Instances) ? instances.Instances : [];
  const selected = configuredInstanceId
    ? available.find(({ InstanceID }) => String(InstanceID) === configuredInstanceId)
    : available.find(({ Status }) => !Status || /active|ready|enabled/i.test(Status));
  if (!selected) {
    throw new AppError('No available Lumen AI Chat instance was found for this API key. Ask the Lumen administrator to configure one.', 503, 'AI_CHAT_NOT_CONFIGURED');
  }
  return String(selected.InstanceID);
};

const instancePath = (instanceId) => `instances/${encodeURIComponent(instanceId)}`;

const openSession = async (base, instanceId) => {
  const opened = await requestLumen(new URL(`${instancePath(instanceId)}/sessions`, base), {
    method: 'POST',
    body: JSON.stringify({ title: 'Earnest AI Assistant' }),
  }, 'session creation');
  const id = opened?.Session?.id;
  if (!id) throw new AppError('Lumen could not open a chat session. Please try again.', 502, 'AI_INVALID_RESPONSE');
  return id;
};

const REFERENCE_HEADER = 'Reference context (paraphrased; verify details at source):\n';

const composeMessage = ({ prompt, question, faq, references }) => {
  const faqPart = faq ? `${formatFaqForPrompt(faq)}\n\n` : '';
  const referencePart = references.length ? REFERENCE_HEADER + formatReferencesForPrompt(references) : '';
  return `${prompt}\n\n${faqPart}${referencePart}\n\nUser question: ${question.trim()}`;
};

// Prompt + context that fits Lumen's message limit: drops general references first, the FAQ facts last.
const buildLumenMessage = ({ question, language, topic, faq }) => {
  const parts = {
    prompt: makeSystemPrompt(language, topic),
    question,
    faq,
    references: [...findRelevantReferences({ question, topic, limit: 2 })],
  };
  let message = composeMessage(parts);
  while (message.length > MAX_LUMEN_MESSAGE_LENGTH && parts.references.length) {
    parts.references.pop();
    message = composeMessage(parts);
  }
  if (message.length > MAX_LUMEN_MESSAGE_LENGTH && parts.faq) {
    parts.faq = null;
    message = composeMessage(parts);
  }
  if (message.length > MAX_LUMEN_MESSAGE_LENGTH) {
    throw new AppError('Question is too long after adding required safety instructions. Please shorten it and try again.', 400, 'QUESTION_TOO_LONG');
  }
  return { message, includedFaq: parts.faq, includedReferences: parts.references };
};

// Sends the turn; a reused session the spec refuses (not ours, gone, other instance, archived) gets a new session and one retry.
const sendTurn = async ({ base, instanceId, state, reusedSession, message }) => {
  const send = () => requestLumen(new URL(`${instancePath(instanceId)}/sessions/${encodeURIComponent(state.sessionId)}/messages`, base), {
    method: 'POST',
    body: JSON.stringify({ message }),
  }, 'message generation');
  try {
    return await send();
  } catch (error) {
    if (!reusedSession || !STALE_SESSION_CODES.has(error?.code)) throw error;
    state.sessionId = await openSession(base, instanceId);
    return send();
  }
};

const citationLinks = (citations) =>
  Array.isArray(citations)
    ? citations.filter((item) => typeof item === 'string').slice(0, 5).map((url) => ({ title: 'Lumen citation', url }))
    : [];

const uniqueByUrl = (links) => {
  const seen = new Set();
  return links.filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
};

const answerWithLumen = async ({ res, question, language, topic, faq, state, reusedSession }) => {
  const base = chatBaseUrl();
  const instanceId = await findInstanceId(base);
  if (!state.sessionId) state.sessionId = await openSession(base, instanceId);

  const { message, includedFaq, includedReferences } = buildLumenMessage({ question, language, topic, faq });
  const result = await sendTurn({ base, instanceId, state, reusedSession, message });
  const answer = result?.Answer?.answer;
  if (!answer?.trim()) throw new AppError('Lumen returned an unreadable answer. Please try again.', 502, 'AI_INVALID_RESPONSE');

  const declined = isDeclinedAnswer(answer);
  if (declined && faq) return sendFaqAnswer(res, { faq, language, reason: 'declined', sessionId: state.sessionId });
  const fallback = declined ? makeReferenceFallback({ question, language, references: includedReferences }) : null;

  // Unique source links: FAQ sources first, then library references, then Lumen citations.
  const references = uniqueByUrl([
    ...(includedFaq ? faqReferenceLinks(includedFaq) : []),
    ...toReferenceLinks(includedReferences),
    ...citationLinks(result?.Answer?.citations),
  ]);

  return sendSuccess(res, {
    answer: (fallback ? fallback.answer : answer).trim(),
    sessionId: state.sessionId,
    source: fallback ? 'reference' : 'lumen',
    cautions: fallback ? [fallback.notice, ...STANDARD_CAUTIONS] : [...STANDARD_CAUTIONS],
    references,
  }, 'Assistant response generated');
};

router.post('/chat', validateRequest(validateChat), async (req, res, next) => {
  const { question, language = 'English', topic = 'labor', sessionId: requestedSessionId } = req.body;
  // Reviewed FAQ entry for basic questions (gross pay, 13th month, holiday pay...).
  const faq = findFaq(question);
  const state = { sessionId: requestedSessionId };

  try {
    return await answerWithLumen({ res, question, language, topic, faq, state, reusedSession: Boolean(requestedSessionId) });
  } catch (error) {
    // Lumen down, slow, or not configured: still answer basic questions from the FAQ.
    if (faq && isLumenFailure(error)) {
      return sendFaqAnswer(res, { faq, language, reason: 'unavailable', sessionId: state.sessionId });
    }
    if (isTimeout(error)) return next(new AppError('Lumen took too long to answer. Please try again.', 504, 'AI_TIMEOUT'));
    return next(error);
  }
});

export default router;
