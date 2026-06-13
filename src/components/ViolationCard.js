import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StatusBadge from './StatusBadge';
import { COLORS, SHADOW, RADIUS , FONTS} from '../theme';

export default function ViolationCard({ order, onPress }) {
  const isCritical = order.violations.some(v => v.severity === 'critical');

  return (
    <TouchableOpacity
      style={[styles.card, isCritical && styles.cardCritical]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Plate + company */}
      <View style={styles.header}>
        <View style={styles.plateWrap}>
          <Text style={styles.plate}>{order.plate}</Text>
          <Text style={styles.company} numberOfLines={1}>{order.company}</Text>
        </View>
        <View style={styles.badgeCol}>
          {order.violations.map((v, i) => (
            <StatusBadge key={i} type={v.type} />
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Violation detail rows */}
      {order.violations.map((v, i) => (
        <View key={i} style={styles.violationRow}>
          <View style={[
            styles.violationDot,
            { backgroundColor: v.severity === 'critical' ? COLORS.danger : COLORS.warning },
          ]} />
          <Text style={styles.violationDetail}>{v.detail}</Text>
        </View>
      ))}

      {/* Meta info chips — matching web card footer style */}
      <View style={styles.metaRow}>
        {[
          { icon: '📍', text: order.loc_name },
          { icon: '👤', text: order.driver   },
          { icon: '🕒', text: order.last_update },
        ].map(({ icon, text }) => (
          <View key={icon} style={styles.metaChip}>
            <Text style={styles.metaIcon}>{icon}</Text>
            <Text style={styles.metaText} numberOfLines={1}>{text}</Text>
          </View>
        ))}
      </View>

      {/* CTA — rectangular, matching web action buttons */}
      <View style={styles.respondRow}>
        <View style={[
          styles.respondBtn,
          isCritical ? styles.respondBtnCritical : styles.respondBtnNormal,
        ]}>
          <Text style={[
            styles.respondText,
            isCritical ? styles.respondTextCritical : styles.respondTextNormal,
          ]}>
            {isCritical ? 'Urgent — Respond' : 'Respond & Intercept →'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    padding:         18,
    marginBottom:    14,
    borderWidth:     1,
    borderColor:     COLORS.border,
    ...SHADOW.sm,
  },
  // Critical: colored left border — same as web stat card bottom border pattern
  cardCritical: {
    borderLeftWidth:  4,
    borderLeftColor:  COLORS.danger,
    borderColor:      'rgba(239,68,68,0.2)',
  },

  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   12,
  },
  plateWrap: { flex: 1, marginRight: 12 },
  plate:     { fontSize: 22, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  company:   { fontSize: 12, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', marginTop: 2 },
  badgeCol:  { alignItems: 'flex-end', gap: 4 },

  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 12 },

  violationRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  violationDot:    { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  violationDetail: { flex: 1, fontSize: 12, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', lineHeight: 18 },

  metaRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  metaChip: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    backgroundColor:  COLORS.pageBg,
    borderRadius:     RADIUS.badge,   // rectangular chips matching web
    paddingHorizontal: 8,
    paddingVertical:  4,
    borderWidth:      1,
    borderColor:     COLORS.border,
  },
  metaIcon: { fontSize: 14 },
  metaText: { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', flex: 1 },

  respondRow:          { marginTop: 12 },
  respondBtn:          { borderRadius: RADIUS.badge, paddingVertical: 10, alignItems: 'center' },
  respondBtnCritical:  { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  respondBtnNormal:    { backgroundColor: COLORS.pageBg, borderWidth: 1, borderColor: COLORS.border },
  respondText:         { fontSize: 13, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },
  respondTextCritical: { color: COLORS.danger },
  respondTextNormal:   { color: COLORS.textSecondary },
});
