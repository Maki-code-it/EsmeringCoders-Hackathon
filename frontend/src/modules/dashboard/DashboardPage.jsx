import { useState } from 'react';
import { FileUp, Calculator, MessageCircle, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import EmptyState from '@/components/EmptyState.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import useDashboardData from './hooks/useDashboardData.js';
import StatCards from './components/StatCards.jsx';
import SalaryTrendChart from './components/SalaryTrendChart.jsx';
import DeductionBreakdown from './components/DeductionBreakdown.jsx';
import HistoryList from './components/HistoryList.jsx';
import ReportActions from './components/ReportActions.jsx';
import RangeFilter from './components/RangeFilter.jsx';

const STEPS = [
  { id: 'upload', icon: FileUp, title: '1. Upload your payslip', text: 'Add a PDF or photo of your payslip.' },
  { id: 'payroll', icon: Calculator, title: '2. Review your pay', text: 'Check the extracted values and see your breakdown.' },
  { id: 'assistant', icon: MessageCircle, title: '3. Ask about your rights', text: 'Get plain-language answers about Philippine labor rules.' },
];

const errorMessage = (error) => {
  if (error?.code === 'UNAUTHENTICATED') return 'Please sign in to see your dashboard.';
  if (error?.code === 'SUPABASE_NOT_CONFIGURED') return 'The dashboard is not connected to the database yet.';
  return error?.message || 'We could not load your dashboard. Please try again.';
};

export default function DashboardPage({ onNavigate }) {
  const [range, setRange] = useState({});
  const [historyType, setHistoryType] = useState('');
  const [historyPage, setHistoryPage] = useState(0);

  // An inverted range is never sent to the server.
  const activeRange = range.from && range.to && range.from > range.to ? {} : range;
  const { status, error, summary, trends, analytics, history, reload } = useDashboardData({
    range: activeRange,
    historyType,
    historyPage,
  });

  const hasPayroll = (summary?.payroll.recordCount ?? 0) > 0;

  return (
    <>
      <PageHeader title="Dashboard" description="Understand your pay and know your rights.">
        <div className="flex flex-wrap items-start gap-2">
          {hasPayroll && <ReportActions range={activeRange} />}
          <Button onClick={() => onNavigate('upload')}>
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Upload payslip
          </Button>
        </div>
      </PageHeader>

      {status === 'loading' && !summary && (
        <p role="status" className="mb-8 text-sm text-muted-foreground">
          Loading your dashboard…
        </p>
      )}

      {status === 'error' && (
        <div className="mb-8">
          <EmptyState icon={AlertCircle} title="Dashboard unavailable" description={errorMessage(error)}>
            <Button variant="outline" onClick={reload}>
              Try again
            </Button>
          </EmptyState>
        </div>
      )}

      {summary && trends && analytics && (
        <>
          <StatCards summary={summary} />
          {hasPayroll ? (
            <>
              <RangeFilter range={range} onChange={setRange} />
              <SalaryTrendChart points={trends.points} />
              <div className="mb-8">
                <DeductionBreakdown items={analytics.deductionBreakdown} currency={summary.payroll.currency} />
              </div>
              <p className="mb-8 text-xs text-muted-foreground">
                Figures are calculated from the payroll values you confirmed. They are not legal advice.
              </p>
            </>
          ) : (
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              {STEPS.map(({ id, icon: Icon, title, text }) => (
                <button key={id} onClick={() => onNavigate(id)} className="text-left">
                  <Card className="h-full transition-colors hover:bg-accent/50">
                    <CardHeader>
                      <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                      <CardTitle className="pt-2">{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {status !== 'error' && (
        <HistoryList
          history={history}
          type={historyType}
          page={historyPage}
          onTypeChange={(value) => {
            setHistoryType(value);
            setHistoryPage(0);
          }}
          onPageChange={setHistoryPage}
        />
      )}
    </>
  );
}
