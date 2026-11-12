import { api } from '@/services/apiClient.js';

/** Payroll API calls. All HTTP goes through the shared api client. */

export const previewBreakdown = (payslip, options) => api.post('/payroll/preview', payslip, options);

export const listRecords = (options) => api.get('/payroll/records', options);

export const getRecord = (id, options) => api.get(`/payroll/records/${encodeURIComponent(id)}`, options);

export const saveRecord = (payslip, options) => api.post('/payroll/records', payslip, options);

export const deleteRecord = (id, options) => api.delete(`/payroll/records/${encodeURIComponent(id)}`, options);

/** The confirmed OCR document a breakdown can be linked to and prefilled from. */
export const getLinkedDocument = async (documentId, options) => (await api.get(`/documents/${encodeURIComponent(documentId)}`, options)).document;
