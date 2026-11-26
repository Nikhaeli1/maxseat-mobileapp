import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator, Animated,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { friendlyError } from '../api/errors';
import Logo from '../components/Logo';
import { COLORS, SHADOW, RADIUS, TYPE, IS_DARK, themed } from '../theme';
import { Field, Button } from '../components/ui';
import { GradientFill } from '../components/Gradient';
import useKeyboardScroll from '../hooks/useKeyboardScroll';

export default function RegisterScreen({ navigation }) {
  const kb = useKeyboardScroll();          // keeps the box you type in above the keyboard
  const { register } = useAuth();

  const [form,    setForm]    = useState({ full_name: '', username: '', mobile: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [showPw,  setShowPw]  = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      // JS-driven: typing re-renders this screen, and on the new Android
      // architecture a native-driven opacity can be reset to 0 by a re-render.
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: false }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: false }),
    ]).start();
    const t = setTimeout(() => { fadeAnim.setValue(1); slideAnim.setValue(0); }, 1200);   // never leave the form faded
    return () => clearTimeout(t);
  }, []);

  // "Next" on the keyboard moves to the next box; "Done" on the last one submits
  const inputs = useRef({});

  const set = (key) => (val) => { setForm(f => ({ ...f, [key]: val })); if (error) setError(''); };

  const validate = () => {
    if (!form.full_name.trim())  return 'Full name is required.';
    if (!form.username.trim())   return 'Username is required.';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return 'Username: letters, numbers, and underscores only.';
    if (form.username.trim().length < 3 || form.username.trim().length > 40) return 'Username must be 3 to 40 characters.';
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
      setError(friendlyError(e, 'Registration failed. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const FIELDS = [
    { key: 'full_name', label: 'Full name',        icon: 'person-outline',      placeholder: 'e.g. Maria Santos',    secure: false, keyboard: 'default'   },
    { key: 'username',  label: 'Username',         icon: 'at-outline',          placeholder: 'e.g. maria_santos',    secure: false, keyboard: 'default'   },
    { key: 'mobile',    label: 'Mobile number',    icon: 'call-outline',        placeholder: 'e.g. 09171234567',     secure: false, keyboard: 'phone-pad' },
    { key: 'password',  label: 'Password',         icon: 'lock-closed-outline', placeholder: 'At least 6 characters', secure: true, keyboard: 'default'  },
    { key: 'confirm',   label: 'Confirm password', icon: 'lock-closed-outline', placeholder: 'Type it again',        secure: true,  keyboard: 'default'   },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle={COLORS.statusBar} backgroundColor={COLORS.pageBg} />
      <GradientFill name="page" glow="light" start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} />

      <ScrollView
        {...kb.scrollProps}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Logo */}
          <View style={styles.logoSection}>
            <Logo size="full" onDark={IS_DARK} />
          </View>

          {/* Card */}
          <View style={styles.card}>

            {/* Passenger badge */}
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Passenger account</Text>
            </View>

            <Text style={styles.cardTitle}>Create your account</Text>
            <Text style={styles.cardSub}>It's free. See how full each jeep is before it arrives.</Text>

            {/* Fields */}
            {FIELDS.map(({ key, label, icon, placeholder, secure, keyboard }, i) => (
              <Field
                key={key}
                ref={(r) => { inputs.current[key] = r; }}
                label={label}
                icon={icon}
                secure={secure}
                value={form[key]}
                returnKeyType={i < FIELDS.length - 1 ? 'next' : 'done'}
                blurOnSubmit={i === FIELDS.length - 1}
                onSubmitEditing={() => {
                  const next = FIELDS[i + 1];
                  if (next) inputs.current[next.key]?.focus();
                  else handleRegister();
                }}
                maxLength={key === 'mobile' ? 13 : 60}
                onChangeText={set(key)}
                placeholder={placeholder}
                keyboardType={keyboard}
                autoCapitalize={key === 'full_name' ? 'words' : 'none'}
                autoCorrect={false}
                hint={key === 'confirm' && form.confirm
                  ? (form.confirm === form.password ? 'Passwords match' : "Passwords don't match yet")
                  : undefined}
              />
            ))}

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <Button label="Create account" icon="checkmark" onPress={handleRegister} loading={loading} style={{ marginTop: 4, marginBottom: 20 }} />

            {/* Back to login */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.75}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>

          </View>

        </Animated.View>
        {/* Room under the form while the keyboard is open, so every box can scroll above it */}
        <View style={{ height: kb.height }} />
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  root:   { flex: 1, backgroundColor: COLORS.pageBg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 24 },
  tagline:     { fontSize: 13.5, fontFamily: 'Outfit_SemiBold', fontWeight: '600', color: COLORS.textMuted, marginTop: 8, letterSpacing: 0.4 },

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
  badgeText: { fontSize: 15.5, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.accent },

  cardTitle: { ...TYPE.title, color: COLORS.textPrimary, marginBottom: 4 },
  cardSub:   { ...TYPE.body, color: COLORS.textSecondary, marginBottom: 22 },

  // Fields — matches web input style
  fieldGroup:  { marginBottom: 16 },
  fieldLabel:  {
    fontSize: 12, fontFamily: 'Outfit_SemiBold', fontWeight: '700',
    
    color: COLORS.textSecondary, marginBottom: 7,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    backgroundColor: COLORS.inputBg, paddingHorizontal: 14, height: 52,
  },
  input:    { flex: 1, fontSize: 15.5, fontFamily: 'Outfit_Regular', fontWeight: '500', color: COLORS.textPrimary },
  peekBtn:  { paddingHorizontal: 6, paddingVertical: 4 },
  peekText: { fontSize: 13.5, fontFamily: 'Outfit_SemiBold', fontWeight: '600', color: COLORS.textSecondary },

  // Error
  errorBox:  {
    backgroundColor: COLORS.dangerBg, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.dangerBorder,
    padding: 12, marginBottom: 14,
  },
  errorText: { fontSize: 14.5, fontFamily: 'Outfit_SemiBold', fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20 },

  // Submit — matches web button: dark → primary on hover
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius:    RADIUS.md,
    height:          52,
    justifyContent:  'center',
    alignItems:      'center',
    marginTop:       4,
    marginBottom:    18,
    ...SHADOW.button,
    shadowColor:     COLORS.dark,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', letterSpacing: 0.3 },

  // Back to login
  loginRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: 15.5, fontFamily: 'Outfit_Regular', fontWeight: '500', color: COLORS.textSecondary },
  loginLink: { fontSize: 15.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.accent, paddingVertical: 6 },

  footer: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12.5, fontFamily: 'Outfit_Regular', fontWeight: '500', marginTop: 8 },
}));
