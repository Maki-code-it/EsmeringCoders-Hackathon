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
          matchFirst(text, [/(?:basic\s*salary|monthly\s*rate|compensation)\s*[:\-]?\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
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
      matchFirst(text, [/basic\s*(?:salary|pay)\s*[:\-]?\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const totalAllowances = toNumber(
    apiStructured.total_allowances ??
      matchFirst(text, [/(?:total\s*)?allowances?\s*[:\-]?\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const sss = toNumber(
    apiStructured.sss ??
      matchFirst(text, [/sss(?:\s*contribution)?\s*[:\-]?\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const philhealth = toNumber(
    apiStructured.philhealth ??
      matchFirst(text, [/philhealth\s*[:\-]?\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const pagibig = toNumber(
    apiStructured.pagibig ??
      matchFirst(text, [/pag-?ibig(?:\s*\/?\s*hdmf)?\s*[:\-]?\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const withholdingTax = toNumber(
    apiStructured.withholding_tax ??
      matchFirst(text, [/(?:withholding\s*tax|w\/?tax|income\s*tax)\s*[:\-]?\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const parsedTotalDeductions = toNumber(
    apiStructured.total_deductions ??
      matchFirst(text, [/total\s*deductions?\s*[:\-]?\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const totalDeductions =
    parsedTotalDeductions || Number((sss + philhealth + pagibig + withholdingTax).toFixed(2));

  const parsedGrossPay = toNumber(
    apiStructured.gross_pay ??
      matchFirst(text, [/gross\s*(?:pay|income|earnings)\s*[:\-]?\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
  );
  const grossPay = parsedGrossPay || Number((basicSalary + totalAllowances).toFixed(2));

  const parsedNetPay = toNumber(
    apiStructured.net_pay ??
      matchFirst(text, [/net\s*(?:pay|salary|take\s*home)\s*[:\-]?\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i]),
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

/**
 * Calls the Lumen OCR API from the backend only, keeping API keys private.
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

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: fileType || 'application/octet-stream' });
  formData.append('file', blob, fileName || 'document');
  formData.append('document_type', documentType);

  let response;
  try {
    response = await fetch(env.lumen.ocrEndpoint, {
      method: 'POST',
      headers: {
        'lumen-api-key': env.lumen.apiKey,
        'lumen-api-secret': env.lumen.apiSecret,
        Accept: 'application/json',
      },
      body: formData,
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
    throw new AppError(
      payload?.message || 'Lumen OCR failed to process the document',
      502,
      'OCR_PROCESSING_FAILED',
    );
  }

  const result = payload?.data ?? payload ?? {};
  const extractedText =
    result.extracted_text ??
    result.text ??
    result.raw_text ??
    (Array.isArray(result.pages) ? result.pages.map((p) => p.text || '').join('\n') : '');

  const structured =
    result.extracted_data && typeof result.extracted_data === 'object'
      ? result.extracted_data
      : result.fields && typeof result.fields === 'object'
        ? result.fields
        : {};

  return {
    extractedText: String(extractedText || ''),
    extractedData: parseExtractedFields(extractedText, documentType, structured),
  };
};