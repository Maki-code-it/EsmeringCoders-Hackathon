import { useEffect, useId, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { CONTRACT_FIELDS, PAYSLIP_FIELDS } from '../lib/documentFields.js';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

const show = (value, type) => {
  if (value === '' || value === null || value === undefined) return '-';
  return type === 'number' ? peso.format(Number(value)) : String(value);
};

/** Read-only view of a verified document's saved values (native <dialog>). */
export default function DocumentViewDialog({ document, onClose }) {
  const ref = useRef(null);
  const titleId = useId();
  const open = Boolean(document);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Keep the page behind the modal from scrolling while it is open.
  useEffect(() => {
    if (!open) return undefined;
    const previous = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    return () => {
      window.document.body.style.overflow = previous;
    };
  }, [open]);

  const fields = document?.document_type === 'contract' ? CONTRACT_FIELDS : PAYSLIP_FIELDS;
  const data = document?.extracted_data || {};
  const verified = Boolean(data.verified_by_user);
  const verifiedAt = data.verified_at ? new Date(data.verified_at).toLocaleDateString() : null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="glass fixed inset-0 m-auto h-fit max-h-[88vh] w-[min(94vw,36rem)] overflow-hidden rounded-3xl p-0 text-foreground backdrop:bg-foreground/30 backdrop:backdrop-blur-sm"
    >
      <div className="max-h-[88vh] space-y-4 overflow-y-auto p-6">
        <div>
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {document?.file_name}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {verified
              ? `Verified${verifiedAt ? ` on ${verifiedAt}` : ''}. These are the values you confirmed.`
              : 'Not verified yet. These values come straight from the scan.'}
          </p>
        </div>

        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {fields.map(({ key, label, type }) => (
            <div key={key}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium">{show(data[key], type)}</dd>
            </div>
          ))}
        </dl>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </dialog>
  );
}
