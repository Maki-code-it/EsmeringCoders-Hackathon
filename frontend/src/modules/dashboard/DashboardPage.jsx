import { FileUp, Calculator, MessageCircle, History } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import EmptyState from '@/components/EmptyState.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';

const STEPS = [
  { id: 'upload', icon: FileUp, title: '1. Upload your payslip', text: 'Add a PDF or photo of your payslip.' },
  { id: 'payroll', icon: Calculator, title: '2. Review your pay', text: 'Check the extracted values and see your breakdown.' },
  { id: 'assistant', icon: MessageCircle, title: '3. Ask about your rights', text: 'Get plain-language answers about Philippine labor rules.' },
];

export default function DashboardPage({ onNavigate }) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Understand your pay and know your rights."
      >
        <Button onClick={() => onNavigate('upload')}>
          <FileUp className="h-4 w-4" aria-hidden="true" />
          Upload payslip
        </Button>
      </PageHeader>

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

      <h2 className="mb-3 font-semibold">Recent analyses</h2>
      <EmptyState
        icon={History}
        title="No analyses yet"
        description="Upload a payslip to get started. Your analyses will appear here."
      />
    </>
  );
}
