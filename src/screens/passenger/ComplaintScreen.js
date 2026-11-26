import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { submitComplaint } from '../../api/apiService';
import { friendlyError } from '../../api/errors';
import { showToast } from '../../components/Toast';
import Icon from '../../components/Icon';
import { GradientFill } from '../../components/Gradient';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS, themed, IS_DARK } from '../../theme';

const T = ROLE.passenger;

const MAX_DETAILS = 500;

const COMPLAINT_TYPES = [
  { key: 'overload', label: 'Passenger Overloading',      icon: 'people-outline', desc: 'PUV is carrying more passengers than allowed.' },
  { key: 'thermal',  label: 'Elevated Cabin Temperature', icon: 'thermometer-outline', desc: 'Cabin temperature is high or exceeds 37.5°C.' },
  { key: 'other',    label: 'Other Violation',            icon: 'alert-circle-outline', desc: 'Describe the violation in the remarks section.' },
];

export default function ComplaintScreen({ route, navigation }) {
  const { plate, puv }              = route.params;
  const [type,        setType]      = useState('');
  const [description, setDesc]      = useState('');
  const [submitting,  setSubmitting] = useState(false);
  const sent = useRef(false);

  // What the live sensors say right now, to point out the matching option
  const suggested = puv ? (puv.overloaded ? 'overload' : puv.hot ? 'thermal' : null) : null;

  // Leaving with a half-written report? Ask first, so it isn't lost by accident.
  const dirty = !!type || description.trim().length > 0;
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!dirty || sent.current) return;
      e.preventDefault();
      Alert.alert('Discard this report?', "You haven't sent it yet.", [
        { text: 'Keep writing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsub;
  }, [navigation, dirty]);

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
              const result = await submitComplaint(plate, type, description.trim());
              sent.current = true;
              showToast(`Report sent. Reference ${result.serial}. You can follow it in My Reports.`, { duration: 4200 });
              navigation.goBack();
            } catch (err) {
              Alert.alert("Couldn't send the report", friendlyError(err, 'Submission failed. Please try again.'));
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

      <View style={styles.header}>
      <GradientFill name="brand" glow />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="chevron-back" size={22} color={COLORS.textOnDark} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Report Violation</Text>
          <Text style={styles.headerSub}>{plate}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">

        {/* PUV SUMMARY */}
        {puv && (
          <View style={[styles.puvSummary, { borderColor: T.primaryMid }]}>
            <Text style={[styles.summaryLabel, { color: T.accent }]}>Reporting for:</Text>
            <Text style={styles.summaryPlate}>{puv.plate}</Text>
            <Text style={styles.summarySub}>{puv.route} · {puv.driver}</Text>
            <View style={styles.summaryChips}>
              <View style={styles.chip}><Text style={styles.chipText}>{puv.passengers}/{puv.capacity} passengers</Text></View>
              <View style={[styles.chip, puv.hot && styles.chipHot]}>
                <Text style={[styles.chipText, puv.hot && { color: COLORS.warning }]}>{puv.temp}°C cabin</Text>
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
          <Text style={[styles.sectionLabel, { color: T.accent }]}>Type of Complaint</Text>
          <Text style={styles.sectionHint}>Select the type of violation you are reporting.</Text>
          {COMPLAINT_TYPES.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[styles.option, type === c.key && { borderColor: T.primary, backgroundColor: T.primaryLight }]}
              onPress={() => setType(c.key)}
              activeOpacity={0.8}
            >
              <Icon name={c.icon} size={22} color={type === c.key ? T.accent : COLORS.textSecondary} style={styles.optionIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, type === c.key && { color: T.accent }]}>{c.label}</Text>
                <Text style={styles.optionDesc}>{c.desc}</Text>
                {suggested === c.key && (
                  <View style={styles.matchTag}>
                    <Text style={styles.matchTagText}>Matches the live sensor reading</Text>
                  </View>
                )}
              </View>
              <View style={[styles.radio, type === c.key && { borderColor: T.primary }]}>
                {type === c.key && <View style={[styles.radioDot, { backgroundColor: T.primary }]} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* DESCRIPTION */}
        <View style={styles.card}>
          <Text style={[styles.sectionLabel, { color: T.accent }]}>Additional Details</Text>
          <TextInput
            style={styles.textArea}
            placeholder="What did you see? Standing passengers, driver behavior, exact location (optional)"
            placeholderTextColor={COLORS.textMuted}
            value={description}
            onChangeText={setDesc}
            multiline
            numberOfLines={5}
            maxLength={MAX_DETAILS}
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{description.length}/{MAX_DETAILS}</Text>
        </View>

        {/* DISCLAIMER */}
        <View style={[styles.disclaimer, { backgroundColor: T.primaryLight, borderColor: T.primaryMid }]}>
          <Text style={[styles.disclaimerText, { color: IS_DARK ? COLORS.textSecondary : T.primaryDark }]}>
            Your report goes to LTFRB and to the cooperative that runs this PUV. You can follow it in My Reports. False reports may be penalized under LTFRB regulations.
          </Text>
        </View>

        {/* SUBMIT */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: type ? T.primary : COLORS.textMuted }]}
          onPress={handleSubmit}
          disabled={!type || submitting}
          activeOpacity={0.85}
        >
            {!!type && <GradientFill name="button" />}
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Submit Report</Text>
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

  header:      { backgroundColor: COLORS.dark, overflow: 'hidden', borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl, paddingTop: 52, paddingBottom: 24, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12},
  backBtn:     { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', justifyContent: 'center', alignItems: 'center' },
  backIcon:    { fontSize: 20, color: COLORS.textOnDark },
  headerTitle: { fontSize: 20, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textOnDark },
  headerSub:   { fontSize: 13.5, color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 2 },

  puvSummary:   { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, borderWidth: 1.5, ...SHADOW.card },
  summaryLabel: { fontSize: 12.5, fontFamily: 'Outfit_SemiBold', fontWeight: '700', marginBottom: 4 },
  summaryPlate: { fontSize: 24, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: COLORS.textPrimary },
  summarySub:   { fontSize: 13.5, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 2, marginBottom: 10 },
  summaryChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip:         { backgroundColor: COLORS.pageBg, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  chipHot:      { backgroundColor: COLORS.warningBg, borderColor: COLORS.warning + '55' },
  chipDanger:   { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger + '55' },
  chipText:     { fontSize: 12.5, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textSecondary },

  card:         { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  sectionLabel: { fontSize: 15.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', marginBottom: 12 },
  sectionHint:  { fontSize: 13.5, color: COLORS.textMuted, marginBottom: 12, marginTop: -6 },

  option:             { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 10, backgroundColor: COLORS.pageBg },
  optionIcon:         { width: 24, textAlign: 'center' },
  optionLabel:        { fontSize: 15.5, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  optionDesc:         { fontSize: 12.5, color: COLORS.textMuted, fontFamily: 'Outfit_Regular', fontWeight: '500' },
  radio:              { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  radioDot:           { width: 11, height: 11, borderRadius: 6 },

  counter:      { fontSize: 12.5, color: COLORS.textMuted, fontFamily: 'Outfit_SemiBold', fontWeight: '600', textAlign: 'right', marginTop: 6 },
  matchTag:     { alignSelf: 'flex-start', marginTop: 6, backgroundColor: COLORS.alert, borderRadius: RADIUS.badge, paddingHorizontal: 8, paddingVertical: 2 },
  matchTagText: { fontSize: 12, color: COLORS.onAlert, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },
  textArea:     { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, fontSize: 15.5, color: COLORS.textPrimary, backgroundColor: COLORS.pageBg, minHeight: 110, fontFamily: 'Outfit_Regular', fontWeight: '500' },

  disclaimer:     { borderRadius: RADIUS.md, padding: 14, marginBottom: 16, borderWidth: 1 },
  disclaimerText: { fontSize: 13.5, fontFamily: 'Outfit_Regular', fontWeight: '500', lineHeight: 18 },

  submitBtn:  { borderRadius: RADIUS.lg, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 6, ...SHADOW.button, shadowColor: T.primary , overflow: 'hidden' },
  submitText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },
}));
