import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, Save, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { validateExtractedFields } from '../lib/documentValidation.js';

const PAYSLIP_FIELDS = [
  { key: 'employer_name', label: 'Employer Name', type: 'text' },
  { key: 'pay_period_start', label: 'Pay Period Start', type: 'text' },
  { key: 'pay_period_end', label: 'Pay Period End', type: 'text' },
  { key: 'payment_date', label: 'Payment Date', type: 'text' },
  { key: 'basic_salary', label: 'Basic Salary (PHP)', type: 'number' },
  { key: 'total_allowances', label: 'Total Allowances (PHP)', type: 'number' },
  { key: 'sss', label: 'SSS Contribution (PHP)', type: 'number' },
  { key: 'philhealth', label: 'PhilHealth (PHP)', type: 'number' },
  { key: 'pagibig', label: 'Pag-IBIG / HDMF (PHP)', type: 'number' },
  { key: 'withholding_tax', label: 'Withholding Tax (PHP)', type: 'number' },
  { key: 'total_deductions', label: 'Total Deductions (PHP)', type: 'number' },
  { key: 'gross_pay', label: 'Gross Pay (PHP)', type: 'number' },
  { key: 'net_pay', label: 'Net Pay (PHP)', type: 'number' },
];

const CONTRACT_FIELDS = [
  { key: 'employer_name', label: 'Employer Name', type: 'text' },
  { key: 'employee_name', label: 'Employee Name', type: 'text' },
  { key: 'position_title', label: 'Position / Job Title', type: 'text' },
  { key: 'employment_type', label: 'Employment Type', type: 'text' },
  { key: 'start_date', label: 'Start Date', type: 'text' },
  { key: 'basic_salary', label: 'Basic Salary (PHP)', type: 'number' },
  { key: 'working_hours', label: 'Working Hours / Schedule', type: 'text' },
];

export default function ExtractedDataEditor({ document, onSave, onReExtract }) {
  const [fields, setFields] = useState({});
  const [rawText, setRawText] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [reExtracting, setReExtracting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!document) return;
    setFields(document.extracted_data || {});
    setRawText(document.extracted_text || '');
    setFieldErrors({});
    setFeedback(null);
  }, [document]);

  if (!document) return null;

  const schema = document.document_type === 'contract' ? CONTRACT_FIELDS : PAYSLIP_FIELDS;

  const handleFieldChange = (key, type, value) => {
    setFields((prev) => ({
      ...prev,
      [key]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const errors = validateExtractedFields(document.document_type, fields);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setFeedback(null);
    try {
      await onSave(document.id, {
        extracted_data: fields,
        extracted_text: rawText,
      });
      setFeedback({ type: 'success', text: 'Extracted data validated and saved.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Could not save corrections. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReExtract = async () => {
    setReExtracting(true);
    setFeedback(null);
    try {
      await onReExtract(document.id);
      setFeedback({ type: 'success', text: 'Re-extracted text using Lumen OCR.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Re-extraction failed.',
      });
    } finally {
      setReExtracting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <span>Review &amp; Correct Extracted Data</span>
            {document.extracted_data?.verified_by_user && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Verified
              </span>
            )}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            File: {document.file_name} • Status: {document.status}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReExtract}
          disabled={reExtracting || saving}
        >
          {reExtracting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          Re-run OCR
        </Button>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schema.map(({ key, label, type }) => (
              <div key={key} className="space-y-1">
                <label htmlFor={`doc-field-${key}`} className="block text-xs font-medium">
                  {label}
                </label>
                <input
                  id={`doc-field-${key}`}
                  type={type}
                  step={type === 'number' ? '0.01' : undefined}
                  value={fields[key] ?? ''}
                  onChange={(e) => handleFieldChange(key, type, e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs focus:border-primary focus:outline-none"
                />
                {fieldErrors[key] && (
                  <p className="text-xs text-destructive">{fieldErrors[key]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label htmlFor="doc-raw-text" className="block text-xs font-medium">
              Extracted Raw Text (Editable)
            </label>
            <textarea
              id="doc-raw-text"
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Raw OCR text will appear here after extraction…"
              className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs shadow-xs focus:border-primary focus:outline-none"
            />
          </div>

          {feedback && (
            <div
              role="status"
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                feedback.type === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
                  : 'border-destructive/40 bg-destructive/10 text-destructive'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving || reExtracting}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Confirm &amp; Save Corrections
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}