import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS , FONTS, IS_DARK, themed } from '../theme';

export default function TempCard({ temp, hot }) {
  const color     = hot ? COLORS.warning   : COLORS.success;
  const bgColor   = hot ? COLORS.warningBg        : COLORS.hoverBg;
  const label     = hot ? 'HIGH TEMP'      : 'NORMAL';
  const textColor = hot ? COLORS.danger        : COLORS.success;

  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.sectionLabel}>Cabin Temperature</Text>
          <Text style={[styles.tempValue, { color }]}>{temp}°C</Text>
          <View style={[styles.pill, { backgroundColor: color + '22', borderColor: color + '55' }]}>
            <Text style={[styles.pillText, { color }]}>{label}</Text>
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
        <Text style={[styles.warning, { color: IS_DARK ? COLORS.textPrimary : textColor }]}>
          Cabin temperature is above the safe limit (37.5°C). Passengers may be at risk.
        </Text>
      )}
    </View>
  );
}

const styles = themed(() => ({
  card:         { borderRadius: RADIUS.lg, padding: 18, marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, color: COLORS.textSecondary, marginBottom: 8 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left:         { flex: 1 },
  right:        { alignItems: 'center', width: 60 },
  tempValue:    { fontSize: 48, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', lineHeight: 56, marginBottom: 8 },
  pill:         { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, alignSelf: 'flex-start' },
  pillText:     { fontSize: 11, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', letterSpacing: 0.5 },
  thermoBg:     { width: 20, height: 80, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end' },
  thermoFill:   { width: '100%', borderRadius: 10 },
  thermoLabel:  { fontSize: 13, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', marginTop: 4 },
  warning:      { marginTop: 12, fontSize: 12, fontFamily: 'Outfit_SemiBold', fontWeight: '600', backgroundColor: IS_DARK ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.5)', borderRadius: RADIUS.sm, padding: 10, lineHeight: 18, overflow: 'hidden' },
}));
