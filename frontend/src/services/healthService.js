import { api } from './apiClient.js';

/** GET /api/health -> { status: 'healthy' } */
export const getHealth = (options) => api.get('/health', options);
