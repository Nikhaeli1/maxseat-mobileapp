import { useEffect, useState } from 'react';

// Number of NEW passenger reports, shared between the officer's tab bar and the
// Passenger reports screen, so the tab badge changes the moment a report is handled.
let current = 0;
const listeners = new Set();

export function publishNewReports(n) {
  const v = Number(n) || 0;
  if (v === current) return;
  current = v;
  listeners.forEach((fn) => fn(v));
}

export function useNewReports() {
  const [n, setN] = useState(current);
  useEffect(() => {
    listeners.add(setN);
    setN(current);
    return () => { listeners.delete(setN); };
  }, []);
  return n;
}
