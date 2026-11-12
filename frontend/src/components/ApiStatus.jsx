import { useEffect, useState } from 'react';
import { getHealth } from '@/services/healthService.js';
import { cn } from '@/components/utils.js';

const STATES = {
  checking: { label: 'Checking API...', dot: 'bg-amber-400', text: 'text-secondary-foreground' },
  online: { label: 'API connected', dot: 'bg-emerald-500 shadow-[0_0_8px_rgb(16_185_129/0.7)]', text: 'text-emerald-900' },
  offline: { label: 'API unreachable', dot: 'bg-red-500 shadow-[0_0_8px_rgb(239_68_68/0.6)]', text: 'text-red-800' },
};

/** Real status from GET /api/health, shown as a glass pill. */
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

  const state = STATES[status];

  return (
    <span
      role="status"
      className={cn('glass-control inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium', state.text)}
    >
      <span className={cn('h-2 w-2 rounded-full', state.dot)} aria-hidden="true" />
      {state.label}
    </span>
  );
}
