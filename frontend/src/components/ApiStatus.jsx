import { useEffect, useState } from 'react';
import { getHealth } from '@/services/healthService.js';
import { cn } from '@/components/utils.js';

const STATES = {
  checking: { label: 'Checking API...', style: 'bg-secondary text-secondary-foreground' },
  online: { label: 'API connected', style: 'bg-emerald-100 text-emerald-800' },
  offline: { label: 'API unreachable', style: 'bg-red-100 text-red-800' },
};

/** Real status from GET /api/health. */
export default function ApiStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const controller = new AbortController();
    getHealth({ signal: controller.signal })
      .then((data) => setStatus(data?.status === 'healthy' ? 'online' : 'offline'))
      .catch((error) => {
        if (error?.name !== 'AbortError') setStatus('offline');
      });
    return () => controller.abort();
  }, []);

  return (
    <span
      role="status"
      className={cn('rounded-full px-3 py-1 text-xs font-medium', STATES[status].style)}
    >
      {STATES[status].label}
    </span>
  );
}
