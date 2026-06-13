import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator, Animated,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { COLORS, SHADOW, RADIUS } from '../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [form,    setForm]    = useState({ full_name: '', username: '', mobile: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [showPw,  setShowPw]  = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    if (!form.full_name.trim())  return 'Full name is required.';
    if (!form.username.trim())   return 'Username is required.';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return 'Username: letters, numbers, and underscores only.';
    if (!form.mobile.trim())     return 'Mobile number is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    return null;
  };

  const handleRegister = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await register({
        username:  form.username.trim().toLowerCase(),
        password:  form.password,
        full_name: form.full_name.trim(),
        mobile:    form.mobile.trim(),
      });
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const FIELDS = [
    { key: 'full_name', label: 'Full Name',       placeholder: 'e.g. Maria Santos',  secure: false, keyboard: 'default'   },
    { key: 'username',  label: 'Username',         placeholder: 'e.g. maria_santos',  secure: false, keyboard: 'default'   },
    { key: 'mobile',    label: 'Mobile Number',    placeholder: 'e.g. 09171234567',   secure: false, keyboard: 'phone-pad' },
    { key: 'password',  label: 'Password',         placeholder: 'Minimum 6 characters', secure: true, keyboard: 'default'  },
    { key: 'confirm',   label: 'Confirm Password', placeholder: 'Re-enter password',  secure: true,  keyboard: 'default'   },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.pageBg} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Logo */}
          <View style={styles.logoSection}>
            <Logo size="full" />
          </View>

          {/* Card */}
          <View style={styles.card}>

            {/* Passenger badge */}
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Passenger Registration</Text>
            </View>

            <Text style={styles.cardTitle}>Create Account</Text>

            {/* Fields */}
            {FIELDS.map(({ key, label, placeholder, secure, keyboard }) => (
              <View key={key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <View style={[
                  styles.inputWrap,
                  form[key] && { borderColor: COLORS.primary },
                ]}>
                  <TextInput
                    style={styles.input}
                    value={form[key]}
                    onChangeText={set(key)}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={secure && !showPw}
                    keyboardType={keyboard}
                    autoCapitalize={key === 'full_name' ? 'words' : 'none'}
                    autoCorrect={false}
                  />
                  {secure && key === 'password' && (
                    <TouchableOpacity onPress={() => setShowPw(v => !v)} style={styles.peekBtn}>
                      <Text style={styles.peekText}>{showPw ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitBtnText}>Create Account</Text>
              }
            </TouchableOpacity>

            {/* Back to login */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.75}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>

          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.pageBg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 24 },
  tagline:     { fontSize: 12, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', color: COLORS.textMuted, marginTop: 8, letterSpacing: 0.4 },

  // Card — matches web glass-card
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.xl,
    padding:         28,
    marginBottom:    20,
    borderWidth:     1,
    borderColor:     COLORS.border,
    ...SHADOW.md,
  },

  // Passenger badge
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  badgeDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  badgeText: { fontSize: 11, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8 },

  cardTitle: { fontSize: 22, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  cardSub:   { fontSize: 13, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', color: COLORS.textSecondary, lineHeight: 19, marginBottom: 22 },

  // Fields — matches web input style
  fieldGroup:  { marginBottom: 16 },
  fieldLabel:  {
    fontSize: 10, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.9,
    color: COLORS.textSecondary, marginBottom: 7,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    backgroundColor: COLORS.inputBg, paddingHorizontal: 14, height: 52,
  },
  input:    { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', color: COLORS.textPrimary },
  peekBtn:  { paddingHorizontal: 6, paddingVertical: 4 },
  peekText: { fontSize: 12, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', color: COLORS.textSecondary },

  // Error
  errorBox:  {
    backgroundColor: COLORS.dangerBg, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.dangerBorder,
    padding: 12, marginBottom: 14,
  },
  errorText: { fontSize: 13, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', color: COLORS.danger, lineHeight: 18 },

  // Submit — matches web button: dark → primary on hover
  submitBtn: {
    backgroundColor: COLORS.dark,
    borderRadius:    RADIUS.md,
    height:          52,
    justifyContent:  'center',
    alignItems:      'center',
    marginTop:       4,
    marginBottom:    18,
    ...SHADOW.button,
    shadowColor:     COLORS.dark,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', letterSpacing: 0.3 },

  // Back to login
  loginRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: 13, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', color: COLORS.textSecondary },
  loginLink: { fontSize: 13, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.primary },

  footer: { textAlign: 'center', color: COLORS.textMuted, fontSize: 11, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', marginTop: 8 },
});
