import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { updatePassengerProfile, changePassengerPassword } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS} from '../../theme';

const T = ROLE.passenger;

export default function ProfileScreen() {
  const { user, logout, switchRole, requestDashTutorial } = useAuth();

  const [mobile,     setMobile]     = useState(user?.mobile || '');
  const [saving,     setSaving]     = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [pwSaving,   setPwSaving]   = useState(false);

  useFocusEffect(useCallback(() => { setMobile(user?.mobile || ''); }, [user]));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePassengerProfile({ mobile });
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not save profile.');
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
      Alert.alert('Password Changed', 'Your password has been updated.');
      setShowPwForm(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not change password.');
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />

      {/* HEADER */}
      <View style={styles.header}>
        <Logo size="header" style={{ marginBottom: 12 }} />
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: T.primary + '22', borderColor: T.primary + '55' }]}>
            <Text style={styles.avatarInitial}>
              {(user?.full_name || user?.username || '?')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.full_name}</Text>
            <Text style={[styles.username, { color: T.primary }]}>@{user?.username}</Text>
            <View style={[styles.rolePill, { backgroundColor: T.primary + '15', borderColor: T.primary + '40' }]}>
              <Text style={[styles.rolePillText, { color: T.primary }]}>Passenger · Bugo–Igpit</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ACCOUNT INFO */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Account Info</Text>
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
          <Text style={styles.sectionLabel}>Edit Profile</Text>
          <Text style={styles.fieldLabel}>Mobile Number</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}></Text>
            <TextInput
              style={styles.input}
              value={mobile}
              onChangeText={setMobile}
              placeholder="e.g. 09171234567"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: COLORS.dark }, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>Save Changes</Text>
            }
          </TouchableOpacity>
        </View>

        {/* CHANGE PASSWORD */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.pwToggleRow} onPress={() => setShowPwForm(v => !v)}>
            <Text style={styles.sectionLabel}>Change Password</Text>
            <Text style={styles.pwToggleIcon}>{showPwForm ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showPwForm && (
            <View style={{ marginTop: 12 }}>
              {[
                { label: 'Current Password', value: currentPw, setter: setCurrentPw },
                { label: 'New Password',     value: newPw,     setter: setNewPw     },
                { label: 'Confirm New',      value: confirmPw, setter: setConfirmPw },
              ].map(({ label, value, setter }) => (
                <View key={label} style={{ marginBottom: 12 }}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={setter}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              ))}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: COLORS.dark }, pwSaving && { opacity: 0.6 }]}
                onPress={handleChangePassword}
                disabled={pwSaving}
              >
                {pwSaving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Update Password</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* TUTORIAL */}
        <TouchableOpacity
          style={styles.tutorialBtn}
          onPress={() => requestDashTutorial('passenger')}
          activeOpacity={0.85}
        >
          <Text style={styles.tutorialIcon}>▶</Text>
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
          <Text style={styles.logoutIcon}>⏻</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>MaxSeat Alert System · Cagayan de Oro City</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.pageBg },
  scroll: { padding: 16 },

  header:     { backgroundColor: COLORS.cardBg, paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, ...SHADOW.sm },
  avatarRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar:     { width: 58, height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  avatarInitial: { fontSize: 26, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', color: T.primary },
  name:       { fontSize: 18, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },
  username:   { fontSize: 12, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', marginTop: 2 },
  rolePill:   { flexDirection: 'row', alignSelf: 'flex-start', borderRadius: RADIUS.badge, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, marginTop: 6 },
  rolePillText: { fontSize: 11, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700' },

  card:         { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  sectionLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.9, color: COLORS.textSecondary, marginBottom: 14 },

  infoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoItem:  { width: '47%', borderRadius: RADIUS.sm, padding: 11, borderWidth: 1 },
  infoLabel: { fontSize: 9, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: COLORS.textMuted, marginBottom: 4 },
  infoValue: { fontSize: 13, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },

  fieldLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: COLORS.textSecondary, marginBottom: 7 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.pageBg, paddingHorizontal: 12, height: 50 },
  inputIcon:  { fontSize: 16, marginRight: 8 },
  input:      { flex: 1, fontSize: 14, color: COLORS.textPrimary, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500' },
  textInput:  { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.pageBg, paddingHorizontal: 14, height: 50, fontSize: 14, color: COLORS.textPrimary, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500' },

  saveBtn:     { borderRadius: RADIUS.md, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },

  pwToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pwToggleIcon:{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },

  tutorialBtn:  { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, height: 60, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, borderWidth: 1.5, borderColor: COLORS.primary + '40', marginBottom: 12, ...SHADOW.card },
  tutorialIcon: { fontSize: 18, color: COLORS.primary, width: 24, textAlign: 'center' },
  tutorialLabel:{ fontSize: 15, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.primary },
  tutorialDesc: { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', marginTop: 1 },

  switchBtn:  { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, height: 60, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, borderWidth: 1.5, borderColor: COLORS.darkBorder, marginBottom: 12, ...SHADOW.card },
  switchIcon: { fontSize: 24 },
  switchLabel:{ fontSize: 15, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },
  switchDesc: { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', marginTop: 1 },

  logoutBtn:  { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, height: 54, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: COLORS.dangerLight, marginBottom: 14 },
  logoutIcon: { fontSize: 18, color: COLORS.danger },
  logoutText: { color: COLORS.danger, fontSize: 15, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },

  footer: { textAlign: 'center', color: COLORS.textMuted, fontSize: 11, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', marginBottom: 8 },
});
