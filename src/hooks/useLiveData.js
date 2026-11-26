import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Live data for a screen.
 *
 *   const live = useLiveData(fetchAllPuvs, { interval: 15000 });
 *   live.data        last good response (kept when a refresh fails)
 *   live.loading     true only until the FIRST answer arrives (show a skeleton)
 *   live.refreshing  true while a pull-to-refresh is running
 *   live.busy        true while any request is running (small "Updating…" hint)
 *   live.error       last error, cleared by the next good answer
 *   live.updatedAt   time of the last good answer (ms)
 *   live.refresh()   pull-to-refresh
 *   live.reload()    quiet refresh (retry buttons)
 *
 * Refreshes when the screen comes back into view, then every `interval` ms
 * while it stays in view and the app is open. Stops in the background.
 * Coming back to a screen never blanks it: old data stays until new data lands.
 */
export default function useLiveData(fetcher, { interval = 15000, initial = null } = {}) {
  const [data,       setData]       = useState(initial);
  const [error,      setError]      = useState(null);
  const [loading,    setLoading]    = useState(initial == null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy,       setBusy]       = useState(false);
  const [updatedAt,  setUpdatedAt]  = useState(null);

  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;
  const inFlight = useRef(false);
  const lastOk   = useRef(0);
  const alive    = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const run = useCallback(async (mode = 'quiet') => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (mode === 'pull') setRefreshing(true);
    setBusy(true);
    try {
      const res = await fetchRef.current();
      if (!alive.current) return;
      setData(res);
      setError(null);
      lastOk.current = Date.now();
      setUpdatedAt(lastOk.current);
    } catch (e) {
      // A 401 signs the user out centrally (see apiService), nothing to show here.
      if (alive.current && e?.response?.status !== 401) setError(e);
    } finally {
      inFlight.current = false;
      if (alive.current) { setLoading(false); setRefreshing(false); setBusy(false); }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    // Skip the fetch if we just got fresh data (fast tab hopping).
    if (Date.now() - lastOk.current > 4000) run();

    let timer = null;
    const stop  = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { stop(); if (interval) timer = setInterval(() => run(), interval); };
    start();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') { run(); start(); }
      else stop();
    });
    return () => { stop(); sub.remove(); };
  }, [run, interval]));

  const refresh = useCallback(() => run('pull'), [run]);
  const reload  = useCallback(() => run('quiet'), [run]);

  return { data, error, loading, refreshing, busy, updatedAt, refresh, reload };
}
