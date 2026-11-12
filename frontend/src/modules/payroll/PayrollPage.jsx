import { useCallback, useEffect, useRef, useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import BreakdownView from './components/BreakdownView.jsx';
import PayslipForm from './components/PayslipForm.jsx';
import RecordList from './components/RecordList.jsx';
import { describeValidation, emptyForm, formatDate, formatPeriod, toPayload } from './lib/payslipForm.js';
import { deleteRecord, getRecord, listRecords, previewBreakdown, saveRecord } from './services/payrollService.js';

const errorLines = (error, form) => {
  if (error?.code === 'VALIDATION_ERROR') return describeValidation(error.details, form);
  return [error?.message || 'Something went wrong. Please try again.'];
};

/**
 * Payroll Breakdown page.
 *   New:   enter payslip lines -> Calculate (backend, nothing saved) -> Save
 *   Saved: pick a record on the right to view its breakdown, or delete it
 */
export default function PayrollPage({ documentId = null }) {
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState(null);
  const [formErrors, setFormErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  const [records, setRecords] = useState([]);
  const [listStatus, setListStatus] = useState('loading');
  const [listError, setListError] = useState(null);

  const [selected, setSelected] = useState(null); // { record, breakdown } of a saved record
  const [viewError, setViewError] = useState(null);
  const resultRef = useRef(null);

  const loadRecords = useCallback(async (signal) => {
    try {
      setRecords(await listRecords({ signal }));
      setListStatus('ready');
      setListError(null);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setListStatus('error');
      setListError(error);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadRecords(controller.signal);
    return () => controller.abort();
  }, [loadRecords]);

  // Any edit makes the previous result outdated.
  const changeForm = (next) => {
    setForm(next);
    setPreview(null);
    setFormErrors([]);
  };

  const scrollToResult = () =>
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  const calculate = async () => {
    setBusy(true);
    setFormErrors([]);
    try {
      setPreview(await previewBreakdown(toPayload(form)));
      scrollToResult();
    } catch (error) {
      setPreview(null);
      setFormErrors(errorLines(error, form));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setFormErrors([]);
    try {
      const saved = await saveRecord({ ...toPayload(form), documentId });
      setSelected(saved);
      setForm(emptyForm());
      setPreview(null);
      await loadRecords();
    } catch (error) {
      setFormErrors(errorLines(error, form));
    } finally {
      setBusy(false);
    }
  };

  const openRecord = async (id) => {
    setViewError(null);
    try {
      setSelected(await getRecord(id));
    } catch (error) {
      setViewError(error?.message || 'Could not load this breakdown.');
    }
  };

  const removeSelected = async () => {
    if (!selected) return;
    // Native confirm keeps this simple and accessible.
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this saved breakdown? This cannot be undone.')) return;
    setBusy(true);
    try {
      await deleteRecord(selected.record.id);
      setSelected(null);
      await loadRecords();
    } catch (error) {
      setViewError(error?.message || 'Could not delete this breakdown.');
    } finally {
      setBusy(false);
    }
  };

  const startNew = () => {
    setSelected(null);
    setViewError(null);
  };

  return (
    <>
      <PageHeader
        title="Payroll Breakdown"
        description="See where your pay goes: earnings, deductions, and take-home pay, with the math shown."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          {viewError && (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {viewError}
            </p>
          )}

          {selected ? (
            <>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <p className="font-semibold">{selected.record.employerName || 'Payslip'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPeriod(selected.record.payPeriodStart, selected.record.payPeriodEnd)}
                      {' \u00b7 '}Saved {formatDate(selected.record.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={startNew}>New breakdown</Button>
                    <Button variant="ghost" onClick={removeSelected} disabled={busy} className="text-destructive">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <BreakdownView breakdown={selected.breakdown} />
            </>
          ) : (
            <>
              <PayslipForm form={form} onChange={changeForm} onCalculate={calculate} busy={busy} errors={formErrors} />

              {preview && (
                <section ref={resultRef} aria-label="Breakdown result" className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Your breakdown</h2>
                    <Button onClick={save} disabled={busy}>
                      <Save className="h-4 w-4" aria-hidden="true" />
                      {busy ? 'Saving...' : 'Save breakdown'}
                    </Button>
                  </div>
                  <BreakdownView breakdown={preview} />
                </section>
              )}
            </>
          )}
        </div>

        <aside className="space-y-2">
          <RecordList
            records={records}
            status={listStatus}
            selectedId={selected?.record.id}
            onSelect={openRecord}
            onNew={startNew}
          />
          {listStatus === 'error' && listError?.message && (
            <p className="px-1 text-xs text-muted-foreground">{listError.message}</p>
          )}
        </aside>
      </div>
    </>
  );
}
