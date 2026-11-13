import { useState } from 'react';
import { Eye, History } from 'lucide-react';
import EmptyState from '@/components/EmptyState.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { analysisLabel, formatDate } from '../lib/format.js';
import { HISTORY_PAGE_SIZE } from '../hooks/useDashboardData.js';
import DocumentViewDialog from '@/modules/documents/components/DocumentViewDialog.jsx';
import { getDocument } from '@/modules/documents/services/documentService.js';
import { getRecord } from '@/modules/payroll/services/payrollService.js';
import PayrollViewDialog from './PayrollViewDialog.jsx';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'payslip', label: 'Payslips' },
  { value: 'contract', label: 'Contracts' },
  { value: 'payroll', label: 'Payroll' },
];

export default function HistoryList({ history, type, page, onTypeChange, onPageChange }) {
  const total = history?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / HISTORY_PAGE_SIZE) - 1);

  // View opens the saved values of an uploaded payslip or contract.
  const [viewing, setViewing] = useState(null);
  const [viewingPayroll, setViewingPayroll] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [viewError, setViewError] = useState('');
  const openItem = async (item) => {
    setViewError('');
    setViewingId(item.id);
    try {
      if (item.kind === 'payroll') setViewingPayroll(await getRecord(item.id));
      else setViewing(await getDocument(item.id));
    } catch (err) {
      setViewError(err?.message || 'Could not open this document.');
    } finally {
      setViewingId(null);
    }
  };

  return (
    <section aria-labelledby="history-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="history-heading" className="font-semibold">Document history</h2>
        <div role="group" aria-label="Filter history" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={type === f.value ? 'default' : 'outline'}
              aria-pressed={type === f.value}
              onClick={() => onTypeChange(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {viewError && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {viewError}
        </p>
      )}

      {!history || history.items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No analyses yet"
          description="Upload a payslip to get started. Your analyses will appear here."
        />
      ) : (
        <Card>
          <CardContent className="p-0 pt-0">
            <ul className="divide-y">
              {history.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium">{analysisLabel(item.kind)}</p>
                    <p className="text-muted-foreground">
                      {item.filename || 'Document not available'}
                      {item.status ? ` · ${item.status.replace(/_/g, ' ')}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <time className="text-muted-foreground" dateTime={item.createdAt}>
                      {formatDate(item.createdAt)}
                    </time>
                    {(item.kind === 'payslip' || item.kind === 'contract' || item.kind === 'payroll') && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={viewingId === item.id}
                        onClick={() => openItem(item)}
                        aria-label={`View ${item.filename || 'document'}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        {viewingId === item.id ? 'Opening…' : 'View'}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
              <span className="text-muted-foreground">
                Page {page + 1} of {lastPage + 1}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="outline" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DocumentViewDialog document={viewing} onClose={() => setViewing(null)} />
      <PayrollViewDialog data={viewingPayroll} onClose={() => setViewingPayroll(null)} />
    </section>
  );
}
