import { env } from '../../config/env.js';
import { AppError } from '../../middleware/apiResponse.js';

const toNumber = (raw) => {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (!raw) return 0;
  const cleaned = String(raw).replaceAll(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

// ---- Field extraction: find a label on a line, then read the value after it with plain string steps (no backtracking regexes). ----

const AMOUNT = /^[\d,]+(?:\.\d{1,2})?/;
const CURRENCY_PREFIXES = ['PHP', '₱'];
const SEPARATORS = new Set([':', '-']);

const dropSeparator = (value) => {
  const s = value.trimStart();
  return SEPARATORS.has(s[0]) ? s.slice(1).trimStart() : null;
};

const dropCurrency = (value) => {
  const prefix = CURRENCY_PREFIXES.find((p) => value.toUpperCase().startsWith(p));
  return prefix ? value.slice(prefix.length).trimStart() : value;
};

// Text after "<label>:" or "<label> -"; an empty remainder means the value is on the next line.
const readText = (rest, nextLine) => {
  const value = dropSeparator(rest);
  if (value === null) return '';
  return value.trim() || (nextLine ?? '').trim();
};

// Amount after "<label>", with an optional ":"/"-" and "PHP"/"₱"; may sit on the next line.
const readAmount = (rest, nextLine) => {
  const afterSeparator = dropSeparator(rest) ?? rest.trimStart();
  const value = dropCurrency(afterSeparator);
  if (value) return AMOUNT.exec(value)?.[0] ?? '';
  return nextLine === undefined ? '' : readAmount(nextLine);
};

const READERS = { text: readText, amount: readAmount };
// Only this many characters after a label are read, so hostile long lines stay linear.
const VALUE_WINDOW = 300;
const windowAt = (line, start = 0) => (line === undefined ? undefined : line.slice(start, start + VALUE_WINDOW));

// First label occurrence (in reading order) followed by a readable value.
const findValue = (lines, label, kind) => {
  const read = READERS[kind];
  for (let i = 0; i < lines.length; i += 1) {
    for (const match of lines[i].matchAll(label)) {
      const value = read(windowAt(lines[i], match.index + match[0].length), windowAt(lines[i + 1]));
      if (value) return value;
    }
  }
  return '';
};

const CONTRACT_FIELDS = {
  employer_name: ['text', /employer|company/gi],
  employee_name: ['text', /employee|worker/gi],
  position_title: ['text', /position|job\s*title|role/gi],
  employment_type: ['text', /employment\s*type|status/gi],
  start_date: ['text', /start\s*date|effective\s*date|commencement/gi],
  basic_salary: ['amount', /basic\s*salary|monthly\s*rate|compensation/gi],
  working_hours: ['text', /working\s*hours|schedule/gi],
};

const PAYSLIP_FIELDS = {
  employer_name: ['text', /employer|company/gi],
  pay_period_start: ['text', /pay\s*period|period\s*from|start\s*date/gi],
  pay_period_end: ['text', /period\s*to|end\s*date/gi],
  payment_date: ['text', /payment\s*date|pay\s*date|date\s*paid/gi],
  basic_salary: ['amount', /basic\s*(?:salary|pay)/gi],
  total_allowances: ['amount', /allowances?/gi],
  sss: ['amount', /sss(?:\s*contribution)?/gi],
  philhealth: ['amount', /philhealth/gi],
  pagibig: ['amount', /pag-?ibig(?:[\s/]*hdmf)?/gi],
  withholding_tax: ['amount', /withholding\s*tax|w\/?tax|income\s*tax/gi],
  total_deductions: ['amount', /total\s*deductions?/gi],
  gross_pay: ['amount', /gross\s*(?:pay|income|earnings)/gi],
  net_pay: ['amount', /net\s*(?:pay|salary|take\s*home)/gi],
};

// Values from the API win; text fields fall back on "" and amounts on 0.
const extractFields = (lines, fields, apiStructured) =>
  Object.fromEntries(
    Object.entries(fields).map(([key, [kind, label]]) => {
      if (kind === 'amount') return [key, toNumber(apiStructured[key] ?? findValue(lines, label, kind))];
      return [key, apiStructured[key] || findValue(lines, label, kind)];
    }),
  );

const round2 = (value) => Number(value.toFixed(2));

// Structures raw OCR text into editable fields matching Earnest's payslip / contract domain so the user can review and correct values.
export const parseExtractedFields = (rawText, documentType, apiStructured = {}) => {
  const lines = String(rawText || '').split(/\r?\n/);
  const currency = apiStructured.currency || 'PHP';

  if (documentType === 'contract') {
    return { ...extractFields(lines, CONTRACT_FIELDS, apiStructured), currency, verified_by_user: false };
  }

  // Default: payslip. Missing totals are derived from their parts.
  const f = extractFields(lines, PAYSLIP_FIELDS, apiStructured);
  const totalDeductions = f.total_deductions || round2(f.sss + f.philhealth + f.pagibig + f.withholding_tax);
  const grossPay = f.gross_pay || round2(f.basic_salary + f.total_allowances);
  let netPay = f.net_pay;
  if (!netPay && grossPay > 0) netPay = round2(grossPay - totalDeductions);

  return {
    ...f,
    total_deductions: totalDeductions,
    gross_pay: grossPay,
    net_pay: netPay,
    currency,
    verified_by_user: false,
  };
};

// ---- Lumen OCR client. Contract: see ./ocr-openapi.yaml (upload bytes -> poll record -> read pages). ----

const OCR_POLL_INTERVAL_MS = 2000;
const OCR_MAX_WAIT_MS = 90_000;
const OCR_MAX_BYTES = 10 * 1024 * 1024; // spec: 10 MiB cap, larger uploads answer 413
// Lumen statuses passed through as-is; other failures become 502.
const PASSTHROUGH_STATUSES = new Set([413, 415, 429, 503]);
const ACCEPTED_MEDIA_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/tiff',
  'image/webp',
]);

const trimTrailingSlashes = (value) => {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') end -= 1;
  return value.slice(0, end);
};

// LUMEN_OCR_ENDPOINT may be the gateway origin, or end in /ocr or /ocr/documents.
const ocrBaseUrl = () => {
  const base = trimTrailingSlashes(env.lumen.ocrEndpoint)
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

// Calls Lumen and returns the `data` of its { data, requestId } envelope.
const lumenRequest = async (path, init = {}) => {
  let response;
  try {
    response = await fetch(`${ocrBaseUrl()}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...init.headers },
    });
  } catch {
    throw new AppError('Failed to reach Lumen OCR service', 502, 'OCR_UNREACHABLE');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const code = payload?.error?.code;
    const status = PASSTHROUGH_STATUSES.has(response.status) ? response.status : 502;
    // Messages here are Lumen's own and never contain document content.
    throw new AppError(
      payload?.error?.message || 'Lumen OCR failed to process the document',
      status,
      code ? `OCR_${String(code).toUpperCase()}` : 'OCR_PROCESSING_FAILED',
    );
  }
  return payload?.data ?? payload ?? {};
};

// Polls the document record until the read ends READY or PARTIAL.
const waitForRead = async (id, status, deadline) => {
  if (status === 'READY' || status === 'PARTIAL') return;
  if (status === 'FAILED') {
    throw new AppError('Lumen OCR could not read this document', 502, 'OCR_READ_FAILED');
  }
  if (Date.now() > deadline) {
    throw new AppError('Lumen OCR took too long. Try again.', 504, 'OCR_TIMEOUT');
  }
  await sleep(OCR_POLL_INTERVAL_MS);
  const record = await lumenRequest(`/documents/${id}`);
  return waitForRead(id, record.Status, deadline);
};

const textOf = (item) =>
  typeof item === 'string' ? item : String(item?.Text ?? item?.text ?? item?.Value ?? '');

// Builds plain text, one line per row, from a Lumen page. Prefers recognised lines; falls back to words (grouped by a line index when given).
const pageToText = (page) => {
  const lines = page?.Lines ?? page?.lines;
  if (Array.isArray(lines) && lines.length) return lines.map(textOf).join('\n');

  const words = page?.Words ?? page?.words;
  if (!Array.isArray(words)) return textOf(page?.Text ?? page?.text);

  const rows = new Map();
  words.forEach((word) => {
    const row = word?.LineIndex ?? word?.lineIndex ?? word?.LineNumber ?? 0;
    rows.set(row, rows.has(row) ? `${rows.get(row)} ${textOf(word)}` : textOf(word));
  });
  return [...rows.values()].join('\n');
};

// Calls the Lumen OCR API from the backend only, keeping API keys private.
export const extractWithLumenOcr = async ({ fileBuffer, fileName, fileType, documentType }) => {
  if (!env.lumen.ocrEndpoint || !env.lumen.apiKey || !env.lumen.apiSecret) {
    throw new AppError(
      'Lumen OCR service is not configured on the server',
      503,
      'OCR_NOT_CONFIGURED',
    );
  }
  const mediaType = fileType === 'image/jpg' ? 'image/jpeg' : fileType;
  if (!ACCEPTED_MEDIA_TYPES.has(mediaType)) {
    throw new AppError('This file type cannot be read by OCR', 415, 'OCR_UNSUPPORTED_TYPE');
  }
  if (fileBuffer?.byteLength > OCR_MAX_BYTES) {
    throw new AppError('This file is larger than the 10 MB OCR limit', 413, 'OCR_FILE_TOO_LARGE');
  }

  // 1. Upload the raw bytes (not multipart).
  const uploaded = await lumenRequest('/documents', {
    method: 'POST',
    headers: {
      'Content-Type': mediaType,
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
  await waitForRead(id, uploaded.Status, Date.now() + OCR_MAX_WAIT_MS);

  // 3. Read the pages.
  const pagesData = await lumenRequest(`/documents/${id}/pages?IncludeWords=true`);
  const pages = Array.isArray(pagesData) ? pagesData : (pagesData.Items ?? pagesData.Pages ?? pagesData.pages ?? []);
  const extractedText = [...pages]
    .sort((a, b) => (a.PageNumber ?? 0) - (b.PageNumber ?? 0))
    .map(pageToText)
    .join('\n');

  return {
    extractedText,
    extractedData: parseExtractedFields(extractedText, documentType),
  };
};
