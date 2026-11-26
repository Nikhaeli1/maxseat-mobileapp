/**
 * How full a PUV is, as one of four states:
 *   'over' : more riders than seats (a violation)
 *   'full' : every seat taken, no room left
 *   'near' : 80% or more of the seats taken
 *   'free' : plenty of seats
 * Uses the real counts, so 22 of 22 is "Full" even when the percent rounds oddly.
 */
export function loadState(p) {
  if (!p) return 'free';
  const passengers = Number(p.passengers) || 0;
  const capacity   = Number(p.capacity) || 0;
  if (p.overloaded || (capacity > 0 && passengers > capacity)) return 'over';
  if (capacity > 0 && passengers >= capacity) return 'full';
  const pct = capacity > 0 ? (passengers / capacity) * 100 : Number(p.load_pct) || 0;
  return pct >= 80 ? 'near' : 'free';
}

export const LOAD_LABEL = {
  over: 'Overloaded',
  full: 'Full',
  near: 'Nearly full',
  free: 'Seats free',
};
