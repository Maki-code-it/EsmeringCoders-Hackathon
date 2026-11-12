import { useEffect, useId, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';

/**
 * Shared confirmation modal for destructive actions (native <dialog>, so focus
 * is trapped, Escape cancels and the page behind is inert while it is open).
 * The caller owns `open`; clicking the backdrop or Cancel calls onCancel.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Keep the page behind the modal from scrolling while it is open.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(event) => {
        if (event.target === ref.current && !busy) onCancel();
      }}
      className="glass fixed inset-0 m-auto w-[min(92vw,26rem)] rounded-3xl p-0 text-foreground backdrop:bg-foreground/30 backdrop:backdrop-blur-sm"
    >
      <div className="max-h-[88vh] space-y-4 overflow-y-auto p-6">
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p id={descId} className="text-sm text-muted-foreground">
          {description}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
