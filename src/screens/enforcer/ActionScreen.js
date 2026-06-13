import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { submitInterception } from '../../api/apiService';
import StatusBadge from '../../components/StatusBadge';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS} from '../../theme';

const T = ROLE.enforcer;

const ACTIONS = [
  { key: 'warning',   label: 'Issue Warning',     icon: '⚠',  desc: 'Verbal or written warning — no fine', color: COLORS.warning },
  { key: 'ticket',    label: 'Issue Ticket',       icon: '📋', desc: 'Formal citation — ₱5,000.00 fine',   color: COLORS.danger  },
  { key: 'apprehend', label: 'Apprehend Vehicle',  icon: '🚔', desc: 'Full apprehension — ₱10,000.00 fine', color: '#7c3aed'    },
];

export default function ActionScreen({ route, navigation }) {
  const { order }   = route.params;
  const [action, setAction] = useState('');
  const [notes,  setNotes]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isCritical = order.violations.some(v => v.severity === 'critical');

  const handleSubmit = async () => {
    if (!action) {
      Alert.alert('Required', 'Please select an enforcement action.');
      return;
    }
    const selected = ACTIONS.find(a => a.key === action);
    Alert.alert(
      'Confirm Submission',
      `Submit interception report for ${order.plate}?\n\nAction: ${selected?.label}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const result = await submitInterception(order.plate, action, notes);
              Alert.alert(
                '✅ Report Submitted',
                `${result.message}\n\nSerial: ${result.serial}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.error || err.message || 'Submission failed.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerPlate}>{order.plate}</Text>
          <Text style={styles.headerSub}>{order.company}</Text>
        </View>
        <View style={styles.badgeStack}>
          {order.violations.map((v, i) => <StatusBadge key={i} type={v.type} />)}
        </View>
      </View>

      {/* Red critical strip */}
      {isCritical && (
        <View style={styles.criticalStrip}>
          <Text style={styles.criticalStripText}>🚨 CRITICAL VIOLATION — IMMEDIATE ACTION REQUIRED</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── MAP ─────────────────────────────────────────────────────── */}
        <View style={styles.mapCard}>
          <View style={styles.mapLabelRow}>
            <Text style={styles.sectionLabel}>📍 Live GNSS Location</Text>
            <Text style={styles.mapLocText}>{order.loc_name}</Text>
          </View>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: order.lat, longitude: order.lng,
              latitudeDelta: 0.01, longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{ latitude: order.lat, longitude: order.lng }}
              pinColor={isCritical ? COLORS.danger : COLORS.warning}
              title={order.plate}
              description={order.loc_name}
            />
          </MapView>
        </View>

        {/* ── VEHICLE INFO ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>🚌 Vehicle Info</Text>
          <View style={styles.infoGrid}>
            {[
              ['Plate',      order.plate],
              ['Driver',     order.driver],
              ['Passengers', `${order.passengers}/${order.capacity}`],
              ['Cabin Temp', `${order.temp}°C`],
              ['Speed',      order.speed],
              ['Schedule',   order.schedule],
            ].map(([label, value]) => {
              const isOverload = label === 'Passengers' && order.passengers > order.capacity;
              const isHot      = label === 'Cabin Temp' && order.temp >= 37.5;
              return (
                <View key={label} style={[styles.infoItem, (isOverload || isHot) && styles.infoItemAlert]}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={[styles.infoValue, (isOverload || isHot) && { color: isOverload ? COLORS.danger : COLORS.warning }]}>
                    {value}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>⚠ Active Violations</Text>
          {order.violations.map((v, i) => (
            <View key={i} style={[styles.violationRow, { borderLeftColor: v.severity === 'critical' ? COLORS.danger : COLORS.warning }]}>
              <StatusBadge type={v.type} />
              <Text style={styles.violationDetail}>{v.detail}</Text>
            </View>
          ))}
        </View>

        {/* ── ENFORCEMENT ACTION ───────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Enforcement Action</Text>
          <Text style={styles.sectionHint}>Select the action to take against this vehicle.</Text>
          {ACTIONS.map(a => (
            <TouchableOpacity
              key={a.key}
              style={[styles.actionOption, action === a.key && { borderColor: a.color, backgroundColor: a.color + '10' }]}
              onPress={() => setAction(a.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionLabel, action === a.key && { color: a.color }]}>
                  {a.label}
                </Text>
                <Text style={styles.actionDesc}>{a.desc}</Text>
              </View>
              <View style={[styles.radio, action === a.key && { borderColor: a.color }]}>
                {action === a.key && <View style={[styles.radioDot, { backgroundColor: a.color }]} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── OFFICER REMARKS ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>📝 Officer Remarks</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Describe the interception — exact location, officer notes, passenger count, driver response…"
            placeholderTextColor={COLORS.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* ── SUBMIT ───────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: action ? T.primary : COLORS.textMuted }]}
          onPress={handleSubmit}
          disabled={!action || submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>📤  Submit Interception Report</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.pageBg },
  scroll: { padding: 16 },

  header:       { backgroundColor: COLORS.dark, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:      { width: 38, height: 38, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  backIcon:     { fontSize: 20, color: COLORS.textOnDark },
  headerCenter: { flex: 1 },
  headerPlate:  { fontSize: 22, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', color: COLORS.textOnDark },
  headerSub:    { fontSize: 12, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', marginTop: 2 },
  badgeStack:   { gap: 4 },

  criticalStrip:     { backgroundColor: COLORS.danger, paddingVertical: 8, paddingHorizontal: 16 },
  criticalStripText: { color: '#fff', fontSize: 11, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },

  card:         { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  sectionLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.9, color: COLORS.textSecondary, marginBottom: 12 },
  sectionHint:  { fontSize: 12, color: COLORS.textMuted, marginBottom: 12, marginTop: -6 },
  divider:      { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 14 },

  mapCard:      { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  mapLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  mapLocText:   { fontSize: 12, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', color: COLORS.textSecondary, flex: 1, textAlign: 'right' },
  map:          { height: 180 },

  infoGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoItem:       { width: '47%', backgroundColor: COLORS.pageBg, borderRadius: RADIUS.sm, padding: 11, borderWidth: 1, borderColor: COLORS.border },
  infoItemAlert:  { borderColor: COLORS.danger + '55', backgroundColor: COLORS.dangerLight },
  infoLabel:      { fontSize: 10, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: COLORS.textMuted, marginBottom: 4 },
  infoValue:      { fontSize: 14, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },

  violationRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.pageBg, borderRadius: RADIUS.sm, padding: 10, marginBottom: 8, borderLeftWidth: 3 },
  violationDetail:{ flex: 1, fontSize: 12, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', lineHeight: 17 },

  actionOption:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 10, backgroundColor: COLORS.pageBg },
  actionIcon:     { fontSize: 22 },
  actionLabel:    { fontSize: 14, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  actionDesc:     { fontSize: 11, color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500' },
  radio:          { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  radioDot:       { width: 11, height: 11, borderRadius: 6 },

  notesInput:   { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, fontSize: 14, color: COLORS.textPrimary, backgroundColor: COLORS.pageBg, minHeight: 110, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500' },

  submitBtn:    { borderRadius: RADIUS.lg, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 6, ...SHADOW.button, shadowColor: T.primary },
  submitText:   { color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },
});
