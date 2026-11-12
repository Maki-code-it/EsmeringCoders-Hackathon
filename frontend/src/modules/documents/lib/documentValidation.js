export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateSelectedFile(file) {
  if (!file) {
    return 'Please select a document file to upload.';
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please upload a PDF, PNG, JPG, or WEBP file.';
  }
  if (file.size <= 0) {
    return 'The selected file is empty.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File exceeds the 10 MB maximum upload limit.';
  }
  return null;
}

export function validateExtractedFields(documentType, fields) {
  const errors = {};

  if (documentType === 'payslip') {
    const numericKeys = [
      'basic_salary',
      'total_allowances',
      'sss',
      'philhealth',
      'pagibig',
      'withholding_tax',
      'total_deductions',
      'gross_pay',
      'net_pay',
    ];
    for (const key of numericKeys) {
      const val = Number(fields[key] ?? 0);
      if (!Number.isFinite(val) || val < 0) {
        errors[key] = 'Must be a non-negative number';
      }
    }
    if (Number(fields.net_pay) > Number(fields.gross_pay) && Number(fields.gross_pay) > 0) {
      errors.net_pay = 'Net pay cannot exceed gross pay';
    }
  } else if (documentType === 'contract') {
    const salary = Number(fields.basic_salary ?? 0);
    if (!Number.isFinite(salary) || salary < 0) {
      errors.basic_salary = 'Must be a non-negative number';
    }
  }

  return errors;
}