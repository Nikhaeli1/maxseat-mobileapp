import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import LeafletMap from '../../components/LeafletMap';
import { submitInterception } from '../../api/apiService';
import { friendlyError } from '../../api/errors';
import Icon from '../../components/Icon';
import { GradientFill } from '../../components/Gradient';
import BusSeats from '../../components/BusSeats';
import StatusBadge from '../../components/StatusBadge';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS, themed, byMode } from '../../theme';

const T = ROLE.enforcer;
const MAX_NOTES = 1000;

const ACTIONS = byMode(() => ([
  { key: 'warning',   label: 'Issue Warning',     icon: 'warning-outline',  desc: 'Verbal or written warning, no fine', color: COLORS.warning },
  { key: 'ticket',    label: 'Issue Ticket',       icon: 'document-text-outline', desc: 'Formal citation, ₱5,000.00 fine',   color: COLORS.danger  },
  { key: 'apprehend', label: 'Apprehend Vehicle',  icon: 'car-outline', desc: 'Full apprehension, ₱10,000.00 fine', color: COLORS.accent    },
]));

export default function ActionScreen({ route, navigation }) {
  const { order }   = route.params;
  const [action, setAction] = useState('');
  const [notes,  setNotes]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const sent = useRef(false);

  const isCritical = (order.violations || []).some(v => v.severity === 'critical');

  // Don't lose a half-filled report to an accidental back swipe
  const dirty = !!action || notes.trim().length > 0;
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!dirty || sent.current) return;
      e.preventDefault();
      Alert.alert('Discard this report?', "It hasn't been submitted yet.", [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsub;
  }, [navigation, dirty]);

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
              const result = await submitInterception(order.plate, action, notes.trim());
              sent.current = true;
              Alert.alert(
                'Report submitted',
                `${result.message}\n\nSerial: ${result.serial}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (err) {
              Alert.alert("Couldn't submit", friendlyError(err, 'Submission failed. Please try again.'));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
      <GradientFill name="brand" glow />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="chevron-back" size={22} color={COLORS.textOnDark} />
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
          <Text style={styles.criticalStripText}>CRITICAL VIOLATION · ACT NOW</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">

        {/* ── MAP ─────────────────────────────────────────────────────── */}
        <View style={styles.mapCard}>
          <View style={styles.mapLabelRow}>
            <Text style={styles.sectionLabel}>Live GNSS Location</Text>
            <Text style={styles.mapLocText}>{order.loc_name}</Text>
          </View>
          <LeafletMap
            style={styles.map}
            interactive={false}
            markers={[{
              id:     order.puv_id,
              lat:    order.lat,
              lng:    order.lng,
              hasGps: order.has_gps,
              color:  isCritical ? COLORS.alert : '#DDF79A',
              radius: 12,
              title:  order.plate,
              lines:  [order.loc_name],
            }]}
          />
        </View>

        {/* ── LIVE CABIN ───────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Live cabin</Text>
          <View style={{ alignItems: 'center', paddingTop: 6 }}>
            <BusSeats passengers={order.passengers} capacity={order.capacity} />
          </View>
        </View>

        {/* ── VEHICLE INFO ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Vehicle Info</Text>
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
          <Text style={styles.sectionLabel}>Active Violations</Text>
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
              <Icon name={a.icon} size={22} color={action === a.key ? a.color : COLORS.textSecondary} style={styles.actionIcon} />
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
          <Text style={styles.sectionLabel}>Officer Remarks</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Exact location, officer notes, passenger count, driver response"
            placeholderTextColor={COLORS.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={5}
            maxLength={MAX_NOTES}
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{notes.length}/{MAX_NOTES}</Text>
        </View>

        {/* ── SUBMIT ───────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: action ? T.primary : COLORS.textMuted }]}
          onPress={handleSubmit}
          disabled={!action || submitting}
          activeOpacity={0.85}
        >
            {!!action && <GradientFill name="button" />}
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Submit Interception Report</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = themed(() => ({
  root:   { flex: 1, backgroundColor: COLORS.pageBg },
  scroll: { padding: 16 },

  header:       { backgroundColor: COLORS.dark, overflow: 'hidden', borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl, paddingTop: 52, paddingBottom: 24, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:      { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', justifyContent: 'center', alignItems: 'center' },
  backIcon:     { fontSize: 20, color: COLORS.textOnDark },
  headerCenter: { flex: 1 },
  headerPlate:  { fontSize: 22, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: COLORS.textOnDark },
  headerSub:    { fontSize: 13.5, color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 2 },
  badgeStack:   { gap: 4 },

  criticalStrip:     { backgroundColor: COLORS.alert, paddingVertical: 8, paddingHorizontal: 16 },
  criticalStripText: { color: COLORS.onAlert, fontSize: 12.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },

  card:         { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  sectionLabel: { fontSize: 15.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  sectionHint:  { fontSize: 13.5, color: COLORS.textMuted, marginBottom: 12, marginTop: -6 },
  divider:      { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 14 },

  mapCard:      { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  mapLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  mapLocText:   { fontSize: 13.5, fontFamily: 'Outfit_SemiBold', fontWeight: '600', color: COLORS.textSecondary, flex: 1, textAlign: 'right' },
  map:          { height: 180 },

  infoGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoItem:       { width: '47%', backgroundColor: COLORS.pageBg, borderRadius: RADIUS.sm, padding: 11, borderWidth: 1, borderColor: COLORS.border },
  infoItemAlert:  { borderColor: COLORS.danger + '55', backgroundColor: COLORS.dangerLight },
  infoLabel:      { fontSize: 12, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 },
  infoValue:      { fontSize: 15.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },

  violationRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.pageBg, borderRadius: RADIUS.sm, padding: 10, marginBottom: 8, borderLeftWidth: 3 },
  violationDetail:{ flex: 1, fontSize: 13.5, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600', lineHeight: 17 },

  actionOption:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 10, backgroundColor: COLORS.pageBg },
  actionIcon:     { width: 24, textAlign: 'center' },
  actionLabel:    { fontSize: 15.5, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  actionDesc:     { fontSize: 12.5, color: COLORS.textMuted, fontFamily: 'Outfit_Regular', fontWeight: '500' },
  radio:          { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  radioDot:       { width: 11, height: 11, borderRadius: 6 },

  counter:      { fontSize: 12.5, color: COLORS.textMuted, fontFamily: 'Outfit_SemiBold', fontWeight: '600', textAlign: 'right', marginTop: 6 },
  notesInput:   { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, fontSize: 15.5, color: COLORS.textPrimary, backgroundColor: COLORS.pageBg, minHeight: 110, fontFamily: 'Outfit_Regular', fontWeight: '500' },

  submitBtn:    { borderRadius: RADIUS.lg, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 6, ...SHADOW.button, shadowColor: T.primary , overflow: 'hidden' },
  submitText:   { color: '#fff', fontSize: 16, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },
}));
