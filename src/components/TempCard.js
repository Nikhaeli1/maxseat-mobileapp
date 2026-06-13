import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS , FONTS} from '../theme';

export default function TempCard({ temp, hot }) {
  const color     = hot ? COLORS.warning   : '#16a34a';
  const bgColor   = hot ? '#fffbeb'        : '#f0fdf4';
  const label     = hot ? 'HIGH TEMP'      : 'NORMAL';
  const icon      = hot ? '🌡'            : '❄';
  const textColor = hot ? '#92400e'        : '#14532d';

  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.sectionLabel}>🌡 Cabin Temperature</Text>
          <Text style={[styles.tempValue, { color }]}>{temp}°C</Text>
          <View style={[styles.pill, { backgroundColor: color + '22', borderColor: color + '55' }]}>
            <Text style={[styles.pillText, { color }]}>{icon} {label}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <View style={styles.thermoBg}>
            <View
              style={[
                styles.thermoFill,
                {
                  height: `${Math.min(Math.max(((temp - 30) / 12) * 100, 0), 100)}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <Text style={[styles.thermoLabel, { color }]}>{temp}°</Text>
        </View>
      </View>
      {hot && (
        <Text style={[styles.warning, { color: textColor }]}>
          ⚠ Cabin temperature exceeds safe limit (37.5°C). Passengers may be at risk.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:         { borderRadius: RADIUS.lg, padding: 18, marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, color: COLORS.textSecondary, marginBottom: 8 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left:         { flex: 1 },
  right:        { alignItems: 'center', width: 60 },
  tempValue:    { fontSize: 48, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', lineHeight: 56, marginBottom: 8 },
  pill:         { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, alignSelf: 'flex-start' },
  pillText:     { fontSize: 11, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', letterSpacing: 0.5 },
  thermoBg:     { width: 20, height: 80, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end' },
  thermoFill:   { width: '100%', borderRadius: 10 },
  thermoLabel:  { fontSize: 13, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', marginTop: 4 },
  warning:      { marginTop: 12, fontSize: 12, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: RADIUS.sm, padding: 10, lineHeight: 18 },
});
