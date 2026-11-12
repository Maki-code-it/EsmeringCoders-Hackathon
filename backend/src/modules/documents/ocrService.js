import { env } from '../../config/env.js';
import { AppError } from '../../middleware/apiResponse.js';

const toNumber = (raw) => {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const matchFirst = (text, patterns) => {
  for (const regex of patterns) {
    const match = text.match(regex);
    if (match?.[1]) return match[1].trim();
  }
  return '';
};

/**
 * Structures raw OCR text into editable fields matching SahodSuri's
 * payslip / contract domain so the user can review and correct values.
 */
export const parseExtractedFields = (rawText, documentType, apiStructured = {}) => {
  const text = String(rawText || '');

  if (documentType === 'contract') {
    return {
      employer_name:
        apiStructured.employer_name ||
        matchFirst(text, [/(?:employer|company)\s*[:\-]\s*([^\n\r]+)/i]),
      employee_name:
        apiStructured.employee_name ||
        matchFirst(text, [/(?:employee|worker)\s*[:\-]\s*([^\n\r]+)/i]),
      position_title:
        apiStructured.position_title ||
        matchFirst(text, [/(?:position|job\s*title|role)\s*[:\-]\s*([^\n\r]+)/i]),
      employment_type:
        apiStructured.employment_type ||
        matchFirst(text, [/(?:employment\s*type|status)\s*[:\-]\s*([^\n\r]+)/i]),
      start_date:
        apiStructured.start_date ||
        matchFirst(text, [/(?:start\s*date|effective\s*date|commencement)\s*[:\-]\s*([^\n\r]+)/i]),
      basic_salary: toNumber(
        apiStructured.basic_salary ??
          matchFirst(text, [/(?:basic\s*salary|monthly\s*rate|compensation)\s*[:\-]?\s*(?:PHP|â‚±)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
      ),
      working_hours:
        apiStructured.working_hours ||
        matchFirst(text, [/(?:working\s*hours|schedule)\s*[:\-]\s*([^\n\r]+)/i]),
      currency: apiStructured.currency || 'PHP',
      verified_by_user: false,
    };
  }

  // Default: payslip
  const basicSalary = toNumber(
    apiStructured.basic_salary ??
      matchFirst(text, [/basic\s*(?:salary|pay)\s*[:\-]?\s*(?:PHP|â‚±)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const totalAllowances = toNumber(
    apiStructured.total_allowances ??
      matchFirst(text, [/(?:total\s*)?allowances?\s*[:\-]?\s*(?:PHP|â‚±)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const sss = toNumber(
    apiStructured.sss ??
      matchFirst(text, [/sss(?:\s*contribution)?\s*[:\-]?\s*(?:PHP|â‚±)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const philhealth = toNumber(
    apiStructured.philhealth ??
      matchFirst(text, [/philhealth\s*[:\-]?\s*(?:PHP|â‚±)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const pagibig = toNumber(
    apiStructured.pagibig ??
      matchFirst(text, [/pag-?ibig(?:\s*\/?\s*hdmf)?\s*[:\-]?\s*(?:PHP|â‚±)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const withholdingTax = toNumber(
    apiStructured.withholding_tax ??
      matchFirst(text, [/(?:withholding\s*tax|w\/?tax|income\s*tax)\s*[:\-]?\s*(?:PHP|â‚±)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const parsedTotalDeductions = toNumber(
    apiStructured.total_deductions ??
      matchFirst(text, [/total\s*deductions?\s*[:\-]?\s*(?:PHP|â‚±)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const totalDeductions =
    parsedTotalDeductions || Number((sss + philhealth + pagibig + withholdingTax).toFixed(2));

  const parsedGrossPay = toNumber(
    apiStructured.gross_pay ??
      matchFirst(text, [/gross\s*(?:pay|income|earnings)\s*[:\-]?\s*(?:PHP|â‚±)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const grossPay = parsedGrossPay || Number((basicSalary + totalAllowances).toFixed(2));

  const parsedNetPay = toNumber(
    apiStructured.net_pay ??
      matchFirst(text, [/net\s*(?:pay|salary|take\s*home)\s*[:\-]?\s*(?:PHP|â‚±)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const netPay =
    parsedNetPay || (grossPay > 0 ? Number((grossPay - totalDeductions).toFixed(2)) : 0);

  return {
    employer_name:
      apiStructured.employer_name ||
      matchFirst(text, [/(?:employer|company)\s*[:\-]\s*([^\n\r]+)/i]),
    pay_period_start:
      apiStructured.pay_period_start ||
      matchFirst(text, [/(?:pay\s*period|period\s*from|start\s*date)\s*[:\-]\s*([^\n\r]+)/i]),
    pay_period_end:
      apiStructured.pay_period_end ||
      matchFirst(text, [/(?:period\s*to|end\s*date)\s*[:\-]\s*([^\n\r]+)/i]),
    payment_date:
      apiStructured.payment_date ||
      matchFirst(text, [/(?:payment\s*date|pay\s*date|date\s*paid)\s*[:\-]\s*([^\n\r]+)/i]),
    basic_salary: basicSalary,
    total_allowances: totalAllowances,
    sss,
    philhealth,
    pagibig,
    withholding_tax: withholdingTax,
    total_deductions: totalDeductions,
    gross_pay: grossPay,
    net_pay: netPay,
    currency: apiStructured.currency || 'PHP',
    verified_by_user: false,
  };
};

const OCR_POLL_INTERVAL_MS = 2000;
const OCR_MAX_WAIT_MS = 90_000;
const ACCEPTED_MEDIA_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/tiff',
  'image/webp',
]);

/** LUMEN_OCR_ENDPOINT may be the gateway origin, or end in /ocr or /ocr/documents. */
const ocrBaseUrl = () => {
  const base = env.lumen.ocrEndpoint
    .replace(/\/+$/, '')
    .replace(/\/documents$/i, '')
    .replace(/\/ocr$/i, '');
  return `${base}/ocr`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const authHeaders = () => ({
  'lumen-api-key': env.lumen.apiKey,
  'lumen-api-secret': env.lumen.apiSecret,
  Accept: 'application/json',
});

/** Calls Lumen and returns the `data` of its { data, requestId } envelope. */
const lumenRequest = async (path, init = {}) => {
  let response;
  try {
    response = await fetch(`${ocrBaseUrl()}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init.headers || {}) },
    });
  } catch {
    throw new AppError('Failed to reach Lumen OCR service', 502, 'OCR_UNREACHABLE');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const code = payload?.error?.code;
    const status = response.status === 503 ? 503 : 502;
    // Messages here are Lumen's own and never contain document content.
    throw new AppError(
      payload?.error?.message || 'Lumen OCR failed to process the document',
      status,
      code ? `OCR_${String(code).toUpperCase()}` : 'OCR_PROCESSING_FAILED',
    );
  }
  return payload?.data ?? payload ?? {};
};

const textOf = (item) =>
  typeof item === 'string' ? item : String(item?.Text ?? item?.text ?? item?.Value ?? '');

/**
 * Builds plain text, one line per row, from a Lumen page. Prefers recognised
 * lines; falls back to words (grouped by a line index when given).
 */
const pageToText = (page) => {
  const lines = page?.Lines ?? page?.lines;
  if (Array.isArray(lines) && lines.length) return lines.map(textOf).join('\n');

  const words = page?.Words ?? page?.words;
  if (!Array.isArray(words)) return textOf(page?.Text ?? page?.text);

  const rows = new Map();
  words.forEach((word) => {
    const row = word?.LineIndex ?? word?.lineIndex ?? word?.LineNumber ?? 0;
    rows.set(row, `${rows.get(row) ?? ''}${rows.has(row) ? ' ' : ''}${textOf(word)}`);
  });
  return [...rows.values()].join('\n');
};

/**
 * Calls the Lumen OCR API from the backend only, keeping API keys private.
 * Flow: upload raw bytes -> poll the document until READY/PARTIAL -> read pages.
 * Never logs raw document content or extracted text.
 */
export const extractWithLumenOcr = async ({ fileBuffer, fileName, fileType, documentType }) => {
  if (!env.lumen.ocrEndpoint || !env.lumen.apiKey || !env.lumen.apiSecret) {
    throw new AppError(
      'Lumen OCR service is not configured on the server',
      503,
      'OCR_NOT_CONFIGURED',
    );
  }
  fileType = fileType === 'image/jpg' ? 'image/jpeg' : fileType;
  if (!ACCEPTED_MEDIA_TYPES.has(fileType)) {
    throw new AppError('This file type cannot be read by OCR', 415, 'OCR_UNSUPPORTED_TYPE');
  }

  // 1. Upload the raw bytes (not multipart).
  const uploaded = await lumenRequest('/documents', {
    method: 'POST',
    headers: {
      'Content-Type': fileType,
      'X-Lumen-Document-Name': encodeURIComponent(fileName || 'document'),
    },
    body: fileBuffer,
  });
  const documentId = uploaded.DocumentID;
  if (!documentId) {
    throw new AppError('Lumen OCR returned no document id', 502, 'OCR_PROCESSING_FAILED');
  }
  const id = encodeURIComponent(documentId);

  // 2. Poll until the read ends.
  const deadline = Date.now() + OCR_MAX_WAIT_MS;
  let status = uploaded.Status;
  while (status !== 'READY' && status !== 'PARTIAL') {
    if (status === 'FAILED') {
      throw new AppError('Lumen OCR could not read this document', 502, 'OCR_READ_FAILED');
    }
    if (Date.now() > deadline) {
      throw new AppError('Lumen OCR took too long. Try again.', 504, 'OCR_TIMEOUT');
    }
    await sleep(OCR_POLL_INTERVAL_MS);
    status = (await lumenRequest(`/documents/${id}`)).Status;
  }

  // 3. Read the pages.
  const pagesData = await lumenRequest(`/documents/${id}/pages?IncludeWords=true`);
  const pages = Array.isArray(pagesData) ? pagesData : (pagesData.Items ?? pagesData.Pages ?? pagesData.pages ?? []);
  const extractedText = [...pages]
    .sort((a, b) => (a.PageNumber ?? 0) - (b.PageNumber ?? 0))
    .map(pageToText)
    .join('\n');

  return {
    extractedText,
    extractedData: parseExtractedFields(extractedText, documentType, {}),
  };
};