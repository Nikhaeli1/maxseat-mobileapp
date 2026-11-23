import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS , FONTS, themed } from '../theme';
import BusSeats from './BusSeats';
import AnimatedBar from './AnimatedBar';

export default function CapacityMeter({ passengers, capacity, loadPct }) {
  const pct      = Math.min(loadPct, 100);
  const over     = passengers > capacity;
  const nearFull = !over && loadPct >= 80;

  const barColor  = over ? COLORS.danger  : nearFull ? COLORS.warning : COLORS.success;
  const bgColor   = over ? COLORS.dangerBg      : nearFull ? COLORS.warningBg      : COLORS.hoverBg;
  const label     = over ? 'OVERLOADED'   : nearFull ? 'NEARLY FULL'  : 'WITHIN LIMIT';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.countRow}>
        <Text style={[styles.paxCount, { color: barColor }]}>{passengers}</Text>
        <Text style={styles.slash}> / </Text>
        <Text style={styles.capCount}>{capacity}</Text>
        <Text style={styles.unit}> pax</Text>
      </View>

      <View style={styles.barWrap}>
        <AnimatedBar pct={pct} color={barColor} track="rgba(255,255,255,0.6)" height={10} />
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.pill, { backgroundColor: barColor + '22', borderColor: barColor + '55' }]}>
          <Text style={[styles.pillText, { color: barColor }]}>{label}</Text>
        </View>
        <Text style={[styles.pctText, { color: barColor }]}>{loadPct}%</Text>
      </View>

      <View style={styles.cabin}>
        <BusSeats passengers={passengers} capacity={capacity} showCaption={false} />
      </View>
    </View>
  );
}

const styles = themed(() => ({
  container: { borderRadius: RADIUS.md, padding: 16 },
  countRow:  { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  paxCount:  { fontSize: 48, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', lineHeight: 52 },
  slash:     { fontSize: 28, color: COLORS.textMuted, fontFamily: 'Outfit_Regular', fontWeight: '300', paddingBottom: 6 },
  capCount:  { fontSize: 28, color: COLORS.textSecondary, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', paddingBottom: 6 },
  unit:      { fontSize: 14, color: COLORS.textMuted, fontFamily: 'Outfit_SemiBold', fontWeight: '600', paddingBottom: 8 },
  barWrap:   { marginBottom: 10 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cabin:     { alignItems: 'center', paddingTop: 4 },
  pill:      { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  pillText:  { fontSize: 11, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', letterSpacing: 0.5 },
  pctText:   { fontSize: 22, fontFamily: 'Outfit_ExtraBold', fontWeight: '900' },
  dotsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  dot:       { width: 14, height: 14, borderRadius: 3 },
  dotsMore:  { fontSize: 11, color: COLORS.textMuted, fontFamily: 'Outfit_SemiBold', fontWeight: '700', alignSelf: 'center' },
}));
