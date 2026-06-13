import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { submitComplaint } from '../../api/apiService';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS} from '../../theme';

const T = ROLE.passenger;

const COMPLAINT_TYPES = [
  { key: 'overload', label: 'Passenger Overloading',      icon: '👥', desc: 'PUV is carrying more passengers than allowed.' },
  { key: 'thermal',  label: 'Elevated Cabin Temperature', icon: '🌡', desc: 'Cabin temperature is high or exceeds 37.5°C.' },
  { key: 'other',    label: 'Other Violation',            icon: '⚠',  desc: 'Describe the violation in the remarks section.' },
];

export default function ComplaintScreen({ route, navigation }) {
  const { plate, puv }              = route.params;
  const [type,        setType]      = useState('');
  const [description, setDesc]      = useState('');
  const [submitting,  setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!type) { Alert.alert('Required', 'Please select a complaint type.'); return; }
    const selected = COMPLAINT_TYPES.find(c => c.key === type);
    Alert.alert(
      'Confirm Report',
      `Submit a "${selected.label}" report for PUV ${plate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const result = await submitComplaint(plate, type, description);
              Alert.alert(
                '✅ Report Submitted',
                `${result.message}\n\nReference: ${result.serial}`,
                [{ text: 'Done', onPress: () => navigation.goBack() }]
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

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Report Violation</Text>
          <Text style={[styles.headerSub, { color: T.primaryMid }]}>{plate}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* PUV SUMMARY */}
        {puv && (
          <View style={[styles.puvSummary, { borderColor: T.primaryMid }]}>
            <Text style={[styles.summaryLabel, { color: T.primary }]}>Reporting for:</Text>
            <Text style={styles.summaryPlate}>{puv.plate}</Text>
            <Text style={styles.summarySub}>{puv.route} · {puv.driver}</Text>
            <View style={styles.summaryChips}>
              <View style={styles.chip}><Text style={styles.chipText}>👥 {puv.passengers}/{puv.capacity} pax</Text></View>
              <View style={[styles.chip, puv.hot && styles.chipHot]}>
                <Text style={[styles.chipText, puv.hot && { color: COLORS.warning }]}>🌡 {puv.temp}°C</Text>
              </View>
              {puv.overloaded && (
                <View style={[styles.chip, styles.chipDanger]}>
                  <Text style={[styles.chipText, { color: COLORS.danger }]}>OVERLOADED</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* COMPLAINT TYPE */}
        <View style={styles.card}>
          <Text style={[styles.sectionLabel, { color: T.primary }]}>Type of Complaint</Text>
          <Text style={styles.sectionHint}>Select the type of violation you are reporting.</Text>
          {COMPLAINT_TYPES.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[styles.option, type === c.key && { borderColor: T.primary, backgroundColor: T.primaryLight }]}
              onPress={() => setType(c.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionIcon}>{c.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, type === c.key && { color: T.primary }]}>{c.label}</Text>
                <Text style={styles.optionDesc}>{c.desc}</Text>
              </View>
              <View style={[styles.radio, type === c.key && { borderColor: T.primary }]}>
                {type === c.key && <View style={[styles.radioDot, { backgroundColor: T.primary }]} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* DESCRIPTION */}
        <View style={styles.card}>
          <Text style={[styles.sectionLabel, { color: T.primary }]}>📝 Additional Details</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe what you observed — standing passengers, driver behavior, exact location… (optional)"
            placeholderTextColor={COLORS.textMuted}
            value={description}
            onChangeText={setDesc}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* DISCLAIMER */}
        <View style={[styles.disclaimer, { backgroundColor: T.primaryLight, borderColor: T.primaryMid }]}>
          <Text style={[styles.disclaimerText, { color: T.primaryDark }]}>
            ℹ Your report will be submitted to the LTFRB enforcement system. False reports may be penalized under LTFRB regulations.
          </Text>
        </View>

        {/* SUBMIT */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: type ? T.primary : COLORS.textMuted }]}
          onPress={handleSubmit}
          disabled={!type || submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>📢  Submit Report</Text>
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

  header:      { backgroundColor: COLORS.dark, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 3, borderBottomColor: T.primary },
  backBtn:     { width: 38, height: 38, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  backIcon:    { fontSize: 20, color: COLORS.textOnDark },
  headerTitle: { fontSize: 20, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textOnDark },
  headerSub:   { fontSize: 12, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', marginTop: 2 },

  puvSummary:   { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, borderWidth: 1.5, ...SHADOW.card },
  summaryLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryPlate: { fontSize: 24, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', color: COLORS.textPrimary },
  summarySub:   { fontSize: 12, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', marginTop: 2, marginBottom: 10 },
  summaryChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip:         { backgroundColor: COLORS.pageBg, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  chipHot:      { backgroundColor: '#fffbeb', borderColor: COLORS.warning + '55' },
  chipDanger:   { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger + '55' },
  chipText:     { fontSize: 11, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', color: COLORS.textSecondary },

  card:         { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  sectionLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 12 },
  sectionHint:  { fontSize: 12, color: COLORS.textMuted, marginBottom: 12, marginTop: -6 },

  option:             { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 10, backgroundColor: COLORS.pageBg },
  optionIcon:         { fontSize: 22 },
  optionLabel:        { fontSize: 14, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  optionDesc:         { fontSize: 11, color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500' },
  radio:              { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  radioDot:           { width: 11, height: 11, borderRadius: 6 },

  textArea:     { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, fontSize: 14, color: COLORS.textPrimary, backgroundColor: COLORS.pageBg, minHeight: 110, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500' },

  disclaimer:     { borderRadius: RADIUS.md, padding: 14, marginBottom: 16, borderWidth: 1 },
  disclaimerText: { fontSize: 12, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', lineHeight: 18 },

  submitBtn:  { borderRadius: RADIUS.lg, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 6, ...SHADOW.button, shadowColor: T.primary },
  submitText: { color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },
});
