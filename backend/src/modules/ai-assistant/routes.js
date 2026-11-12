import { Router } from 'express';
import { env } from '../../config/env.js';
import { AppError, sendSuccess } from '../../middleware/apiResponse.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { makeSystemPrompt } from './prompts.js';
import { findRelevantReferences, formatReferencesForPrompt, toReferenceLinks } from './referenceLibrary.js';
import { makeReferenceFallback } from './referenceAnswers.js';

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

const lumenHeaders = () => ({
  'Content-Type': 'application/json',
  'lumen-api-key': env.lumen.apiKey,
  'lumen-api-secret': env.lumen.apiSecret,
});

const requestLumen = async (url, options = {}, stage = 'request') => {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { ...lumenHeaders(), ...options.headers },
      signal: AbortSignal.timeout(27000),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new AppError(`Lumen timed out during ${stage}. Please try again.`, 504, `LUMEN_${stage.toUpperCase().replaceAll(' ', '_')}_TIMEOUT`);
    }
    throw new AppError(`Could not connect to Lumen during ${stage}. Check the gateway origin and try again.`, 502, `LUMEN_${stage.toUpperCase().replaceAll(' ', '_')}_CONNECTION_ERROR`);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const providerCode = data?.code || data?.error?.code || data?.errorCode;
    const code = typeof providerCode === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(providerCode)
      ? providerCode
      : `LUMEN_${stage.toUpperCase().replaceAll(' ', '_')}_HTTP_${response.status}`;
    const safeStatus = [400, 403, 404, 409, 429, 502, 503, 504].includes(response.status) ? response.status : 502;
    throw new AppError(
      response.status === 400 ? `Lumen rejected the ${stage} request. Check the endpoint and request format.`
        : response.status === 403 ? 'Lumen refused the request. Check the AI Chat grant and available API credits.'
        : response.status === 404 ? 'The configured Lumen chat instance was not found.'
          : response.status === 504 ? 'Lumen took too long to answer. Please try again.'
            : `Lumen returned HTTP ${response.status} during ${stage}. Check the Lumen gateway and service status.`,
      safeStatus,
      code,
    );
  }
  return data;
};

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

router.post('/chat', validateRequest(validateChat), async (req, res, next) => {
  try {
    if (!chatOrigin || !env.lumen.apiKey || !env.lumen.apiSecret) {
      throw new AppError('AI chat is not configured yet. Set the Lumen gateway origin and credentials in the backend environment.', 503, 'AI_NOT_CONFIGURED');
    }

    const { question, language = 'English', history = [], topic = 'labor', sessionId: requestedSessionId } = req.body;
    let origin;
    try {
      origin = new URL(chatOrigin);
    } catch {
      throw new AppError('AI chat is not configured correctly. Please contact the project team.', 503, 'AI_NOT_CONFIGURED');
    }
    if (!['https:', 'http:'].includes(origin.protocol)) {
      throw new AppError('AI chat is not configured correctly. Please contact the project team.', 503, 'AI_NOT_CONFIGURED');
    }

    const base = new URL('/ai_chat/', origin);
    const instances = await requestLumen(new URL('instances', base), {}, 'instance lookup');
    const availableInstances = Array.isArray(instances?.Instances) ? instances.Instances : [];
    const selectedInstance = configuredInstanceId
      ? availableInstances.find(({ InstanceID }) => String(InstanceID) === configuredInstanceId)
      : availableInstances.find(({ Status }) => !Status || /active|ready|enabled/i.test(Status));
    if (!selectedInstance) {
      throw new AppError('No available Lumen AI Chat instance was found for this API key. Ask the Lumen administrator to configure one.', 503, 'AI_CHAT_NOT_CONFIGURED');
    }

    const instanceId = String(selectedInstance.InstanceID);
    let sessionId = requestedSessionId;
    if (!sessionId) {
      const opened = await requestLumen(new URL(`instances/${encodeURIComponent(instanceId)}/sessions`, base), {
        method: 'POST',
        body: JSON.stringify({ title: 'SahodSuri AI Assistant' }),
      }, 'session creation');
      sessionId = opened?.Session?.id;
      if (!sessionId) throw new AppError('Lumen could not open a chat session. Please try again.', 502, 'AI_INVALID_RESPONSE');
    }

    const references = findRelevantReferences({ question, topic, limit: 2 });
    let includedReferences = [...references];
    const makeContextualQuestion = () => `${makeSystemPrompt(language, topic)}\n\n${includedReferences.length ? `Reference context (paraphrased; verify details at source):\n${formatReferencesForPrompt(includedReferences)}` : ''}\n\nUser question: ${question.trim()}`;
    let contextualQuestion = makeContextualQuestion();
    while (contextualQuestion.length > MAX_LUMEN_MESSAGE_LENGTH && includedReferences.length) {
      includedReferences.pop();
      contextualQuestion = makeContextualQuestion();
    }
    if (contextualQuestion.length > MAX_LUMEN_MESSAGE_LENGTH) {
      throw new AppError('Question is too long after adding required safety instructions. Please shorten it and try again.', 400, 'QUESTION_TOO_LONG');
    }
    const result = await requestLumen(new URL(`instances/${encodeURIComponent(instanceId)}/sessions/${encodeURIComponent(sessionId)}/messages`, base), {
      method: 'POST',
      body: JSON.stringify({ message: contextualQuestion }),
    }, 'message generation');
    let answer = result?.Answer?.answer;
    if (!answer?.trim()) throw new AppError('Lumen returned an unreadable answer. Please try again.', 502, 'AI_INVALID_RESPONSE');

    const fallback = /outside what this assistant covers|outside.*covers/i.test(answer)
      ? makeReferenceFallback({ question, language, references: includedReferences })
      : null;
    if (fallback) answer = fallback.answer;

    return sendSuccess(res, {
      answer: answer.trim(),
      sessionId,
      cautions: [
        ...(fallback ? [fallback.notice] : []),
        'AI-generated or reference-based information may be incomplete. Verify important payroll details with your records and current official guidance.',
        'This is general information, not legal advice. A deduction or employment term cannot be judged from this chat alone.',
      ],
      references: [
        ...toReferenceLinks(includedReferences),
        ...(Array.isArray(result?.Answer?.citations)
          ? result.Answer.citations.filter((item) => typeof item === 'string').slice(0, 5).map((url) => ({ title: 'Lumen citation', url }))
          : []),
      ],
    }, 'Assistant response generated');
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError' || error?.code === 'AI_CHAT_REPLY_TIMEOUT') {
      return next(new AppError('Lumen took too long to answer. Please try again.', 504, 'AI_TIMEOUT'));
    }
    return next(error);
  }
});

export default router;
