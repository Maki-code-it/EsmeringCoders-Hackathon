import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, Save, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import ActionCompleteDialog from '@/components/ActionCompleteDialog.jsx';
import { Input } from '@/components/ui/input.jsx';
import { validateExtractedFields } from '../lib/documentValidation.js';
import { CONTRACT_FIELDS, PAYSLIP_FIELDS } from '../lib/documentFields.js';

export default function ExtractedDataEditor({ document, onSave, onReExtract }) {
  const [fields, setFields] = useState({});
  const [rawText, setRawText] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [reExtracting, setReExtracting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [completion, setCompletion] = useState(null);

  useEffect(() => {
    if (!document) return;
    setFields(document.extracted_data || {});
    setRawText(document.extracted_text || '');
    setFieldErrors({});
    setFeedback(null);
    setCompletion(null);
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
        // Only the confirmed fields are kept. The raw OCR text holds the whole payslip, so it is cleared once the user has verified the values.
        extracted_text: '',
      });
      setRawText('');
      setCompletion({
        title: 'Extraction confirmed and saved',
        description: 'Your verified values are saved and the raw OCR text was removed.',
      });
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
    setCompletion(null);
    try {
      await onReExtract(document.id);
      setCompletion({ title: 'Text extraction complete', description: 'The document was processed again with Lumen OCR. Review the extracted details.' });
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
                <Input
                  id={`doc-field-${key}`}
                  type={type}
                  step={type === 'number' ? '0.01' : undefined}
                  value={fields[key] ?? ''}
                  onChange={(e) => handleFieldChange(key, type, e.target.value)}
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
              placeholder={document.extracted_data?.verified_by_user ? 'Removed after you confirmed. Re-run OCR to read the file again.' : 'Raw OCR text will appear here after extraction…'}
              className="glass-field w-full rounded-2xl p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>

          {feedback && (
            <div
              role="status"
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm ${
                'border-destructive/40 bg-destructive/10 text-destructive'
              }`}
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
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
      <ActionCompleteDialog
        open={Boolean(completion)}
        title={completion?.title}
        description={completion?.description}
        onClose={() => setCompletion(null)}
      />
    </Card>
  );
}
