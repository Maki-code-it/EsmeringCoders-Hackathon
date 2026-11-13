import { useCallback, useEffect, useState } from 'react';
import {
  getAnalytics,
  getHistory,
  getSalaryTrends,
  getSummary,
} from '../services/dashboardService.js';

export const HISTORY_PAGE_SIZE = 10;

// Loads everything the dashboard shows. Requests are aborted on unmount or when the filters change, so a slow earlier response can never overwrite a newer one.
export default function useDashboardData({ range, historyType, historyPage }) {
  const [state, setState] = useState({ status: 'loading', error: null });
  const [data, setData] = useState({ summary: null, trends: null, analytics: null });
  const [history, setHistory] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const from = range?.from;
  const to = range?.to;

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', error: null });
    Promise.all([
      getSummary(controller.signal),
      getSalaryTrends({ from, to }, controller.signal),
      getAnalytics({ from, to }, controller.signal),
    ])
      .then(([summary, trends, analytics]) => {
        setData({ summary, trends, analytics });
        setState({ status: 'ready', error: null });
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setState({ status: 'error', error });
      });
    return () => controller.abort();
  }, [from, to, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    getHistory(
      { limit: HISTORY_PAGE_SIZE, offset: historyPage * HISTORY_PAGE_SIZE, type: historyType },
      controller.signal,
    )
      .then(setHistory)
      .catch((error) => {
        if (error?.name !== 'AbortError') setHistory(null);
      });
    return () => controller.abort();
  }, [historyType, historyPage, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { ...state, ...data, history, reload };
}
