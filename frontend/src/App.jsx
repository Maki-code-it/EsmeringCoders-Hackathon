import { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, FileUp, Calculator, MessageCircle, Hammer } from 'lucide-react';
import AppLayout from '@/components/AppLayout.jsx';
import ApiStatus from '@/components/ApiStatus.jsx';
import PageHeader from '@/components/PageHeader.jsx';
import EmptyState from '@/components/EmptyState.jsx';
import DashboardPage from '@/modules/dashboard/DashboardPage.jsx';
import AIAssistantPage from '@/modules/ai-assistant/AIAssistantPage.jsx';
import PayrollPage from '@/modules/payroll/PayrollPage.jsx';
import DocumentsPage from '@/modules/documents/DocumentsPage.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Payslip', icon: FileUp },
  { id: 'payroll', label: 'Payroll Breakdown', icon: Calculator },
  { id: 'assistant', label: 'AI Assistant', icon: MessageCircle },
];

// Hash-based navigation: no router dependency needed for the MVP.
const readPage = () => {
  const id = window.location.hash.replace('#/', '');
  return NAV_ITEMS.some((item) => item.id === id) ? id : 'dashboard';
};

export default function App() {
  const [page, setPage] = useState(readPage);

  useEffect(() => {
    const onHashChange = () => setPage(readPage());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((id) => {
    window.location.hash = `#/${id}`;
  }, []);

  const current = NAV_ITEMS.find((item) => item.id === page);

  return (
    <AppLayout
      navItems={NAV_ITEMS}
      activeId={page}
      onNavigate={navigate}
      topbarRight={<ApiStatus />}
    >
      {page === 'dashboard' ? (
        <DashboardPage onNavigate={navigate} />
      ) : page === 'upload' ? (
        <DocumentsPage onNavigate={navigate} />
      ) : page === 'assistant' ? (
        <AIAssistantPage />
      ) : page === 'payroll' ? (
        <PayrollPage />
      ) : (
        <>
          <PageHeader title={current.label} />
          <EmptyState
            icon={Hammer}
            title="Not built yet"
            description="This page is the next step of the MVP and has no functionality yet."
          />
        </>
      )}
    </AppLayout>
  );
}
