import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, themed } from '../theme';
import { shortError } from '../api/errors';

function ago(ms) {
  if (!ms) return '';
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
}

/**
 * "● Live · updated 12s ago". Shows "Updating…" while a request runs and
 * "Offline · last update 2 min ago" when the last refresh failed.
 */
export default function LiveStamp({ updatedAt, busy, error, onDark = false, style }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  let dot = COLORS.primary;
  let text;
  if (busy && !updatedAt) text = 'Loading…';
  else if (busy) text = 'Updating…';
  else if (error) { dot = COLORS.alert; text = updatedAt ? `${shortError(error)} · last update ${ago(updatedAt)}` : shortError(error); }
  else if (updatedAt) text = `Live · updated ${ago(updatedAt)}`;
  else return null;

  return (
    <View style={[styles.row, style]}>
      <View style={[styles.dot, { backgroundColor: onDark && dot === COLORS.primary ? COLORS.alert : dot }]} />
      <Text style={[styles.text, onDark && { color: 'rgba(255,255,255,0.75)' }]} numberOfLines={1}>{text}</Text>
    </View>
  );
}

const styles = themed(() => ({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:  { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.semiBold, fontWeight: '600' },
}));
