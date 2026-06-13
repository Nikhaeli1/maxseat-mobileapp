import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS , FONTS} from '../theme';

export default function CapacityMeter({ passengers, capacity, loadPct }) {
  const pct      = Math.min(loadPct, 100);
  const over     = passengers > capacity;
  const nearFull = !over && loadPct >= 80;

  const barColor  = over ? COLORS.danger  : nearFull ? COLORS.warning : '#16a34a';
  const bgColor   = over ? '#fef2f2'      : nearFull ? '#fffbeb'      : '#f0fdf4';
  const label     = over ? 'OVERLOADED'   : nearFull ? 'NEARLY FULL'  : 'WITHIN LIMIT';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.countRow}>
        <Text style={[styles.paxCount, { color: barColor }]}>{passengers}</Text>
        <Text style={styles.slash}> / </Text>
        <Text style={styles.capCount}>{capacity}</Text>
        <Text style={styles.unit}> pax</Text>
      </View>

      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.pill, { backgroundColor: barColor + '22', borderColor: barColor + '55' }]}>
          <Text style={[styles.pillText, { color: barColor }]}>{label}</Text>
        </View>
        <Text style={[styles.pctText, { color: barColor }]}>{loadPct}%</Text>
      </View>

      <View style={styles.dotsRow}>
        {Array.from({ length: Math.min(capacity, 20) }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < Math.min(passengers, 20) ? barColor : COLORS.border },
            ]}
          />
        ))}
        {capacity > 20 && <Text style={styles.dotsMore}>+{capacity - 20}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: RADIUS.md, padding: 16 },
  countRow:  { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  paxCount:  { fontSize: 48, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', lineHeight: 52 },
  slash:     { fontSize: 28, color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '300', paddingBottom: 6 },
  capCount:  { fontSize: 28, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', paddingBottom: 6 },
  unit:      { fontSize: 14, color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', paddingBottom: 8 },
  barBg:     { height: 10, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 5, marginBottom: 10, overflow: 'hidden' },
  barFill:   { height: 10, borderRadius: 5 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  pill:      { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  pillText:  { fontSize: 11, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', letterSpacing: 0.5 },
  pctText:   { fontSize: 22, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900' },
  dotsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  dot:       { width: 14, height: 14, borderRadius: 3 },
  dotsMore:  { fontSize: 11, color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', alignSelf: 'center' },
});
