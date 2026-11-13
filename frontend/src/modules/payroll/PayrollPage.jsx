import { useCallback, useEffect, useRef, useState } from 'react';
import { Link2Off, Paperclip, Save, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog.jsx';
import ActionCompleteDialog from '@/components/ActionCompleteDialog.jsx';
import PageHeader from '@/components/PageHeader.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import BreakdownView from './components/BreakdownView.jsx';
import BreakdownSummary from './components/BreakdownSummary.jsx';
import PayslipForm from './components/PayslipForm.jsx';
import RecordList from './components/RecordList.jsx';
import { describeValidation, emptyForm, formFromExtracted, formatDate, formatPeriod, toPayload } from './lib/payslipForm.js';
import { deleteRecord, getLinkedDocument, getRecord, listRecords, previewBreakdown, saveRecord } from './services/payrollService.js';

const errorLines = (error, form) => {
  if (error?.code === 'VALIDATION_ERROR') return describeValidation(error.details, form);
  return [error?.message || 'Something went wrong. Please try again.'];
};

// Payroll Breakdown page: enter payslip lines, calculate (nothing saved), save, or view/delete saved records.
export default function PayrollPage({ documentId = null }) {
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState(null);
  const [formErrors, setFormErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  const [records, setRecords] = useState([]);
  const [listStatus, setListStatus] = useState('loading');
  const [listError, setListError] = useState(null);

  const [selected, setSelected] = useState(null); // { record, breakdown } of a saved record
  const [summaryLanguage, setSummaryLanguage] = useState('English');
  const [actionNotice, setActionNotice] = useState('');
  const [viewError, setViewError] = useState(null);
  const resultRef = useRef(null);

  // The confirmed document this breakdown is linked to (and was prefilled from).
  const [linked, setLinked] = useState(null); // { id, fileName }
  const [linkError, setLinkError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

  // Arriving from 'Analyze in Payroll': load the document, link it, prefill the form.
  useEffect(() => {
    if (!documentId) return undefined;
    const controller = new AbortController();
    setLinkError('');
    getLinkedDocument(documentId, { signal: controller.signal })
      .then((doc) => {
        if (doc.document_type !== 'payslip') {
          setLinkError('Only payslips can be turned into a payroll breakdown.');
          return;
        }
        setSelected(null);
        setPreview(null);
        setFormErrors([]);
        setForm(formFromExtracted(doc.extracted_data || {}));
        setLinked({ id: doc.id, fileName: doc.file_name });
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setLinkError(error?.message || 'Could not load that document.');
      });
    return () => controller.abort();
  }, [documentId]);

  // Any edit makes the previous result outdated.
  const changeForm = (next) => {
    setForm(next);
    setPreview(null);
    setFormErrors([]);
    setActionNotice('');
  };

  const scrollToResult = () =>
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  const calculate = async () => {
    setBusy(true);
    setFormErrors([]);
    setActionNotice('');
    try {
      setPreview(await previewBreakdown(toPayload(form)));
      setActionNotice('Breakdown calculated. Review the figures below.');
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
    setActionNotice('');
    try {
      const saved = await saveRecord({ ...toPayload(form), documentId: linked?.id ?? null });
      setSelected(saved);
      setLinked(null);
      setForm(emptyForm());
      setPreview(null);
      await loadRecords();
      setActionNotice('Breakdown saved successfully.');
    } catch (error) {
      setFormErrors(errorLines(error, form));
    } finally {
      setBusy(false);
    }
  };

  const openRecord = async (id) => {
    setViewError(null);
    setActionNotice('');
    try {
      const record = await getRecord(id);
      setSelected(record);
    } catch (error) {
      setViewError(error?.message || 'Could not load this breakdown.');
    }
  };

  const removeSelected = async () => {
    if (!selected) return;
    setBusy(true);
    setActionNotice('');
    try {
      await deleteRecord(selected.record.id);
      setSelected(null);
      await loadRecords();
    } catch (error) {
      setViewError(error?.message || 'Could not delete this breakdown.');
    } finally {
      setBusy(false);
      setConfirmingDelete(false);
    }
  };

  // 'New' always gives a blank form: drops the open record, the result, any errors and the document link.
  const startNew = () => {
    setSelected(null);
    setViewError(null);
    setForm(emptyForm());
    setPreview(null);
    setFormErrors([]);
    setLinked(null);
    setLinkError('');
    setActionNotice('');
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
            <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3.5 text-sm text-destructive">
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
                    <Button variant="ghost" onClick={() => setConfirmingDelete(true)} disabled={busy} className="text-destructive">
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
              {linkError && (
                <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3.5 text-sm text-destructive">
                  {linkError}
                </p>
              )}
              {linked && (
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <p className="flex items-center gap-2 text-sm">
                      <Paperclip className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span>
                        Filled from <strong>{linked.fileName}</strong>. Check every amount, then calculate.
                      </span>
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setLinked(null)}>
                      <Link2Off className="h-4 w-4" aria-hidden="true" />
                      Unlink
                    </Button>
                  </CardContent>
                </Card>
              )}
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

        <aside className="space-y-4">
          <RecordList
            records={records}
            status={listStatus}
            selectedId={selected?.record.id}
            onSelect={openRecord}
            onNew={startNew}
          />
          <BreakdownSummary
            breakdown={selected?.breakdown || preview}
            language={summaryLanguage}
            onLanguageChange={setSummaryLanguage}
          />
          {listStatus === 'error' && listError?.message && (
            <p className="px-1 text-xs text-muted-foreground">{listError.message}</p>
          )}
        </aside>
      </div>
      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this breakdown?"
        description="The saved breakdown and its lines are removed. This cannot be undone."
        confirmLabel="Delete breakdown"
        busy={busy}
        onConfirm={removeSelected}
        onCancel={() => setConfirmingDelete(false)}
      />
      <ActionCompleteDialog
        open={Boolean(actionNotice)}
        title={actionNotice.startsWith('Breakdown calculated') ? 'Breakdown calculated' : 'Breakdown saved'}
        description={actionNotice}
        onClose={() => setActionNotice('')}
      />
    </>
  );
}
