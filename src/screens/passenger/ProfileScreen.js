import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { updatePassengerProfile, changePassengerPassword } from '../../api/apiService';
import { friendlyError } from '../../api/errors';
import { showToast } from '../../components/Toast';
import { useThemeMode } from '../../context/ThemeContext';
import Icon from '../../components/Icon';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import { Field } from '../../components/ui';
import Gradient, { GradientFill } from '../../components/Gradient';
import useKeyboardScroll, { fieldFocused } from '../../hooks/useKeyboardScroll';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS, themed } from '../../theme';

const T = ROLE.passenger;

export default function ProfileScreen() {
  const kb = useKeyboardScroll();          // keeps the box you type in above the keyboard
  const { user, logout, switchRole, requestDashTutorial, updateUser } = useAuth();
  const navigation = useNavigation();

  // The tutorial highlights elements on the Home tab, so jump there first —
  // then flag the request, which HomeScreen picks up when it gains focus.
  const handleReplayTutorial = useCallback(() => {
    navigation.navigate('PUVs');
    requestDashTutorial('passenger');
  }, [navigation, requestDashTutorial]);

  const [mobile,     setMobile]     = useState(user?.mobile || '');
  const [saving,     setSaving]     = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [pwSaving,   setPwSaving]   = useState(false);

  useFocusEffect(useCallback(() => { setMobile(user?.mobile || ''); }, [user]));

  const mobileChanged = mobile.trim() !== (user?.mobile || '').trim();

  const { mode: themeMode, setMode: setThemeMode } = useThemeMode();
  const chooseTheme = (m) => {
    if (m === themeMode) return;
    setThemeMode(m);
    const msg = m === 'dark' ? 'Dark mode on' : m === 'light' ? 'Light mode on' : "Following your phone's setting";
    setTimeout(() => showToast(msg), 120);
  };

  const handleSave = async () => {
    if (!mobileChanged) return;
    setSaving(true);
    try {
      const res = await updatePassengerProfile({ mobile: mobile.trim() });
      // Keep the new number on this phone too, so it's still there next time
      await updateUser({ mobile: res?.mobile ?? mobile.trim() });
      showToast('Mobile number saved');
    } catch (err) {
      Alert.alert("Couldn't save", friendlyError(err, 'Could not save profile.'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { Alert.alert('Required', 'Fill in all password fields.'); return; }
    if (newPw !== confirmPw) { Alert.alert('Mismatch', 'New passwords do not match.'); return; }
    if (newPw.length < 6)    { Alert.alert('Too Short', 'Password must be at least 6 characters.'); return; }
    setPwSaving(true);
    try {
      await changePassengerPassword({ current_password: currentPw, new_password: newPw });
      showToast('Password updated');
      setShowPwForm(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      Alert.alert("Couldn't change password", friendlyError(err, 'Could not change password.'));
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () =>
    Alert.alert('Log Out', 'End your session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);

  const handleSwitchRole = () =>
    Alert.alert('Switch to Enforcer Mode', 'This will end your passenger session.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Switch', onPress: () => switchRole('enforcer') },
    ]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* HEADER (gradient hero) */}
      <View style={styles.header}>
        <GradientFill name="brand" glow />
        <Logo size="header" onDark style={{ marginBottom: 18 }} />
        <View style={styles.avatarRow}>
          <Gradient name="lime" style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {(user?.full_name || user?.username || '?')[0].toUpperCase()}
            </Text>
          </Gradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.full_name}</Text>
            <Text style={styles.username}>@{user?.username}</Text>
            <View style={styles.rolePill}>
              <Icon name="bus" size={13} color="#FFFFFF" />
              <Text style={styles.rolePillText}>Passenger · Bugo to Igpit</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView {...kb.scrollProps} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ACCOUNT INFO */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Account info</Text>
          <View style={styles.infoGrid}>
            {[
              ['Full Name', user?.full_name || '—'],
              ['Username',  user?.username  || '—'],
              ['Role',      'Passenger'],
              ['Route',     'Bugo–Igpit'],
            ].map(([label, value]) => (
              <View key={label} style={[styles.infoItem, { backgroundColor: T.primaryLight, borderColor: T.primaryMid }]}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* EDIT PROFILE */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Edit profile</Text>
          <Text style={styles.fieldLabel}>Mobile number</Text>
          <View style={styles.inputWrap}>
            <Icon name="call-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              onFocus={fieldFocused}
              style={styles.input}
              value={mobile}
              onChangeText={setMobile}
              placeholder="e.g. 09171234567"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              maxLength={13}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: COLORS.primary }, (saving || !mobileChanged) && { opacity: 0.45 }]}
            onPress={handleSave}
            disabled={saving || !mobileChanged}
          >
            <GradientFill name="button" />
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>{mobileChanged ? 'Save changes' : 'No changes'}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* CHANGE PASSWORD */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.pwToggleRow} onPress={() => setShowPwForm(v => !v)}>
            <Text style={styles.sectionLabel}>Change password</Text>
            <Icon name={showPwForm ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {showPwForm && (
            <View style={{ marginTop: 12 }}>
              {[
                { label: 'Current password',     value: currentPw, setter: setCurrentPw },
                { label: 'New password',         value: newPw,     setter: setNewPw     },
                { label: 'Confirm new password', value: confirmPw, setter: setConfirmPw },
              ].map(({ label, value, setter }) => (
                <Field
                  key={label}
                  label={label}
                  icon="lock-closed-outline"
                  secure
                  value={value}
                  onChangeText={setter}
                  placeholder="Type your password"
                />
              ))}
              {confirmPw.length > 0 && (
                <Text style={[styles.pwHint, newPw === confirmPw && newPw.length >= 6 && { color: COLORS.accent }]}>
                  {newPw.length < 6
                    ? 'New password needs at least 6 characters'
                    : newPw === confirmPw ? 'Passwords match' : "Passwords don't match yet"}
                </Text>
              )}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: COLORS.primary }, pwSaving && { opacity: 0.6 }]}
                onPress={handleChangePassword}
                disabled={pwSaving}
              >
                <GradientFill name="button" />
                {pwSaving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Update password</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* APPEARANCE */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <View style={styles.segment}>
            {[['light', 'Light'], ['dark', 'Dark'], ['system', 'Phone']].map(([m, label]) => {
              const on = themeMode === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.segBtn, on && styles.segBtnOn]}
                  onPress={() => chooseTheme(m)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.segText, on && styles.segTextOn]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.segHint}>
            {themeMode === 'system' ? "Follows your phone's light or dark setting." : 'Saved on this phone.'}
          </Text>
        </View>

        {/* TUTORIAL */}
        <TouchableOpacity
          style={styles.tutorialBtn}
          onPress={handleReplayTutorial}
          activeOpacity={0.85}
        >
          <Icon name="play-circle-outline" size={24} color={COLORS.accent} style={styles.tutorialIcon} />
          <View>
            <Text style={styles.tutorialLabel}>Replay Tutorial</Text>
            <Text style={styles.tutorialDesc}>Watch the app walkthrough again</Text>
          </View>
        </TouchableOpacity>

        {/* SWITCH ROLE */}
        <TouchableOpacity style={styles.switchBtn} onPress={handleSwitchRole} activeOpacity={0.85}>
          <View>
            <Text style={styles.switchLabel}>Switch to Enforcer Mode</Text>
            <Text style={styles.switchDesc}>Log in as an LTFRB officer</Text>
          </View>
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Icon name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>MaxSeat Alert System · Cagayan de Oro City</Text>
        <View style={{ height: 32 }} />
        <View style={{ height: kb.height }} />
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  root:   { flex: 1, backgroundColor: COLORS.pageBg },
  scroll: { padding: 16 },

  header:     { backgroundColor: COLORS.dark, overflow: 'hidden', paddingTop: 52, paddingBottom: 26, paddingHorizontal: 20, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl },
  avatarRow:  { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar:     { width: 68, height: 68, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 30, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: COLORS.onAlert },
  name:       { fontSize: 22, lineHeight: 28, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: '#FFFFFF' },
  username:   { fontSize: 14.5, fontFamily: 'Outfit_SemiBold', fontWeight: '700', marginTop: 1, color: 'rgba(255,255,255,0.8)' },
  rolePill:   { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: 11, paddingVertical: 5, marginTop: 8, backgroundColor: 'rgba(255,255,255,0.16)' },
  rolePillText: { fontSize: 13, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: '#FFFFFF' },

  card:         { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  sectionLabel: { fontSize: 15.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },

  infoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoItem:  { width: '47%', borderRadius: RADIUS.sm, padding: 11, borderWidth: 1 },
  infoLabel: { fontSize: 11, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 },
  infoValue: { fontSize: 14.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },

  fieldLabel: { fontSize: 12.5, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textSecondary, marginBottom: 7 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.pageBg, paddingHorizontal: 12, height: 50 },
  inputIcon:  { marginRight: 8 },
  input:      { flex: 1, fontSize: 15.5, color: COLORS.textPrimary, fontFamily: 'Outfit_Regular', fontWeight: '500' },
  textInput:  { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.pageBg, paddingHorizontal: 14, height: 50, fontSize: 15.5, color: COLORS.textPrimary, fontFamily: 'Outfit_Regular', fontWeight: '500' },

  saveBtn:     { borderRadius: RADIUS.md, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 16, overflow: 'hidden' },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },

  pwHint:      { fontSize: 13.5, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: -4 },
  pwToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pwToggleIcon:{ fontSize: 14.5, color: COLORS.textSecondary, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },

  segment:      { flexDirection: 'row', backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md, padding: 4, gap: 4, borderWidth: 1, borderColor: COLORS.border },
  segBtn:       { flex: 1, height: 40, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  segBtnOn:     { backgroundColor: COLORS.primary },
  segText:      { fontSize: 15.5, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textSecondary },
  segTextOn:    { color: '#FFFFFF' },
  segHint:      { fontSize: 13.5, color: COLORS.textMuted, fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 10 },
  tutorialBtn:  { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, height: 60, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, borderWidth: 1.5, borderColor: COLORS.primary + '40', marginBottom: 12, ...SHADOW.card },
  tutorialIcon: { fontSize: 18, color: COLORS.accent, width: 24, textAlign: 'center' },
  tutorialLabel:{ fontSize: 16, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.accent },
  tutorialDesc: { fontSize: 12.5, color: COLORS.textSecondary, fontFamily: 'Outfit_Regular', fontWeight: '500', marginTop: 1 },

  switchBtn:  { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, height: 60, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, borderWidth: 1.5, borderColor: COLORS.darkBorder, marginBottom: 12, ...SHADOW.card },
  switchIcon: { fontSize: 24 },
  switchLabel:{ fontSize: 16, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },
  switchDesc: { fontSize: 12.5, color: COLORS.textSecondary, fontFamily: 'Outfit_Regular', fontWeight: '500', marginTop: 1 },

  logoutBtn:  { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, height: 54, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: COLORS.dangerLight, marginBottom: 14 },
  logoutIcon: { fontSize: 18, color: COLORS.danger },
  logoutText: { color: COLORS.danger, fontSize: 16, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },

  footer: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12.5, fontFamily: 'Outfit_Regular', fontWeight: '500', marginBottom: 8 },
}));
