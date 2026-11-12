import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { getPayrollReport } from '../services/dashboardService.js';
import { exportCsv, exportPdf } from '../services/reportExport.js';

/** Fetches a fresh report for the selected range, then downloads it. */
export default function ReportActions({ range }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const run = async (kind) => {
    setBusy(kind);
    setError('');
    try {
      const report = await getPayrollReport(range);
      if (kind === 'csv') exportCsv(report);
      else await exportPdf(report);
    } catch (err) {
      setError(err?.message || 'Could not create the report. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button variant="outline" disabled={busy !== null} onClick={() => run('csv')}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {busy === 'csv' ? 'Preparing…' : 'Download CSV'}
        </Button>
        <Button variant="outline" disabled={busy !== null} onClick={() => run('pdf')}>
          <FileText className="h-4 w-4" aria-hidden="true" />
          {busy === 'pdf' ? 'Preparing…' : 'Download PDF'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
