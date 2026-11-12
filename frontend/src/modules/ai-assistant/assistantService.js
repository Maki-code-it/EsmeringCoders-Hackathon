import { api } from '@/services/apiClient.js';

export const sendAssistantMessage = (payload, options) =>
  api.post('/ai-assistant/chat', payload, options);
