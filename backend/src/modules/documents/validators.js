const ALLOWED_DOCUMENT_TYPES = new Set(['payslip', 'contract']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value);

export const sanitizeFileName = (fileName) => {
  const base = String(fileName || 'document')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '');
  return base.slice(0, 120) || 'document';
};

export const validateCreateDocument = (req) => {
  const errors = {};
  const { document_type, file_name, file_type, file_size, file_path, document_id } = req.body || {};

  if (!ALLOWED_DOCUMENT_TYPES.has(document_type)) {
    errors.document_type = 'Document type must be either payslip or contract';
  }

  if (!file_name || typeof file_name !== 'string' || !file_name.trim()) {
    errors.file_name = 'File name is required';
  }

  if (file_type && !ALLOWED_MIME_TYPES.has(String(file_type).toLowerCase())) {
    errors.file_type = 'Only PDF, PNG, JPG, and WEBP files are supported';
  }

  if (file_size !== undefined && file_size !== null) {
    const size = Number(file_size);
    if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE_BYTES) {
      errors.file_size = 'File size must be between 1 byte and 10 MB';
    }
  }

  if (document_id !== undefined && !isValidUuid(document_id)) {
    errors.document_id = 'Invalid document ID format';
  }

  if (file_path !== undefined && (typeof file_path !== 'string' || !file_path.trim())) {
    errors.file_path = 'Invalid file path';
  }

  return errors;
};

export const validateDocumentIdParam = (req) => {
  const errors = {};
  if (!isValidUuid(req.params?.id)) {
    errors.id = 'Invalid document ID';
  }
  return errors;
};

export const validateCorrectionPayload = (req) => {
  const errors = {};
  const { extracted_data, extracted_text, document_type } = req.body || {};

  if (
    extracted_data === undefined &&
    extracted_text === undefined &&
    document_type === undefined
  ) {
    errors.body = 'Provide extracted_data, extracted_text, or document_type to update';
  }

  if (
    extracted_data !== undefined &&
    (typeof extracted_data !== 'object' || extracted_data === null || Array.isArray(extracted_data))
  ) {
    errors.extracted_data = 'extracted_data must be a valid key-value object';
  }

  if (extracted_text !== undefined && typeof extracted_text !== 'string') {
    errors.extracted_text = 'extracted_text must be a string';
  }

  if (document_type !== undefined && !ALLOWED_DOCUMENT_TYPES.has(document_type)) {
    errors.document_type = 'Document type must be either payslip or contract';
  }

  return errors;
};