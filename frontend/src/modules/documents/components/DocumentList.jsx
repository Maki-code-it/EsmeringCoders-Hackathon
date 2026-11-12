import { FileText, Trash2, CheckCircle2, Clock, AlertTriangle, Eye, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';

const STATUS_BADGES = {
  completed: { label: 'Extracted', icon: CheckCircle2, className: 'text-emerald-700 bg-emerald-500/15' },
  processing: { label: 'Processing', icon: Clock, className: 'text-amber-700 bg-amber-500/15' },
  uploaded: { label: 'Uploaded', icon: Clock, className: 'text-sky-700 bg-sky-500/15' },
  failed: { label: 'Failed', icon: AlertTriangle, className: 'text-destructive bg-destructive/15' },
};

export default function DocumentList({ documents, selectedId, onSelect, onDelete, onView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uploaded Documents ({documents.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents uploaded yet. Upload a payslip or employment contract above to start.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {documents.map((doc) => {
              const verified = Boolean(doc.extracted_data?.verified_by_user);
              const badge = verified
                ? { label: 'Verified', icon: BadgeCheck, className: 'text-emerald-700 bg-emerald-500/15' }
                : STATUS_BADGES[doc.status] || STATUS_BADGES.uploaded;
              const BadgeIcon = badge.icon;
              const isSelected = doc.id === selectedId;

              return (
                <li
                  key={doc.id}
                  className={`flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 ${
                    isSelected ? 'rounded-2xl bg-accent/50 px-3' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(doc)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{doc.file_name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                    >
                      <BadgeIcon className="h-3 w-3" aria-hidden="true" />
                      {badge.label}
                    </span>

                    {verified && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={`View ${doc.file_name}`}
                        onClick={() => onView(doc)}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        View
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${doc.file_name}`}
                      onClick={() => onDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}