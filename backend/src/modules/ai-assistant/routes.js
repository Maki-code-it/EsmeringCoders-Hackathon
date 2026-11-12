import { Router } from 'express';
import { env } from '../../config/env.js';
import { AppError, sendSuccess } from '../../middleware/apiResponse.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { makeSystemPrompt } from './prompts.js';

const router = Router();
const MAX_HISTORY = 10;
const ALLOWED_ROLES = new Set(['user', 'assistant']);

const validateChat = (req) => {
  const errors = {};
  const { question, language = 'English', history = [], topic = 'labor' } = req.body || {};
  if (typeof question !== 'string' || !question.trim()) errors.question = 'Enter a question.';
  else if (question.trim().length > 4000) errors.question = 'Question must be 4,000 characters or fewer.';
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
    if (!env.lumen.chatEndpoint || !env.lumen.apiKey || !env.lumen.apiSecret) {
      throw new AppError('AI chat is not configured yet. Ask the project team to set up the Lumen credentials and endpoint.', 503, 'AI_NOT_CONFIGURED');
    }

    const { question, language = 'English', history = [], topic = 'labor' } = req.body;
    let endpoint;
    try {
      endpoint = new URL(env.lumen.chatEndpoint);
    } catch {
      throw new AppError('AI chat is not configured correctly. Please contact the project team.', 503, 'AI_NOT_CONFIGURED');
    }
    if (!['https:', 'http:'].includes(endpoint.protocol)) {
      throw new AppError('AI chat is not configured correctly. Please contact the project team.', 503, 'AI_NOT_CONFIGURED');
    }

    // The configured Lumen endpoint owns its request contract. Send the minimal
    // normalized data and keep both credentials in server-side headers.
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'lumen-api-key': env.lumen.apiKey,
        'lumen-api-secret': env.lumen.apiSecret,
      },
      body: JSON.stringify({
        systemPrompt: makeSystemPrompt(language, topic),
        messages: [...history, { role: 'user', content: question.trim() }],
        language,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!upstream.ok) {
      throw new AppError('Lumen could not answer right now. Please try again later.', 502, 'AI_PROVIDER_ERROR');
    }
    const result = await upstream.json().catch(() => null);
    const answer = typeof result?.answer === 'string' ? result.answer
      : typeof result?.message === 'string' ? result.message
        : typeof result?.content === 'string' ? result.content
          : null;
    if (!answer?.trim()) throw new AppError('Lumen returned an unreadable answer. Please try again.', 502, 'AI_INVALID_RESPONSE');

    return sendSuccess(res, {
      answer: answer.trim(),
      cautions: ['AI-generated information may be incomplete. Verify important payroll details with your records and current official guidance.', 'This is general information, not legal advice. A deduction or employment term cannot be judged from this chat alone.'],
      references: Array.isArray(result.references) ? result.references.filter((item) => typeof item === 'string').slice(0, 5) : [],
    }, 'Assistant response generated');
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return next(new AppError('Lumen took too long to answer. Please try again.', 504, 'AI_TIMEOUT'));
    }
    return next(error);
  }
});

export default router;
