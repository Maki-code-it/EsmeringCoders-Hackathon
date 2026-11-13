import { useEffect, useId, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

/** Accessible modal for a completed workflow action. */
export default function ActionCompleteDialog({ open, title = 'Action complete', description, onClose }) {
  const ref = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === ref.current) onClose(); }}
      className="glass fixed inset-0 m-auto w-[min(92vw,26rem)] rounded-3xl p-0 text-foreground backdrop:bg-foreground/30 backdrop:backdrop-blur-sm"
    >
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        <p id={descriptionId} className="text-sm text-muted-foreground">{description}</p>
        <div className="flex justify-end"><Button onClick={onClose}>Continue</Button></div>
      </div>
    </dialog>
  );
}
