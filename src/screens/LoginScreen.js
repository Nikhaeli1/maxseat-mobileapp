import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert, StatusBar, Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS} from '../theme';
import Logo from '../components/Logo';

export default function LoginScreen({ navigation }) {
  const { login, pendingRole } = useAuth();

  const [role,     setRole]     = useState(pendingRole || 'passenger');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (pendingRole) setRole(pendingRole);
  }, [pendingRole]);

  // ── Entry animations ────────────────────────────────────────────────────────
  const logoAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardY    = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(cardAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(cardY,    { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const theme = ROLE[role];

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password, role);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Login failed. Check your credentials.';
      Alert.alert('Authentication Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={theme.gradFrom} />

      {/* Role-tinted gradient background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.gradFrom }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.gradTo, opacity: 0.55 }]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── LOGO (fades in first) ──────────────────────────────────────── */}
        <Animated.View style={[styles.logoSection, { opacity: logoAnim }]}>
          <Logo size="full" style={styles.logoImage} />
        </Animated.View>

        {/* ── GLASS CARD (slides up after logo) ─────────────────────────── */}
        <Animated.View style={[
          styles.card,
          { opacity: cardAnim, transform: [{ translateY: cardY }] },
        ]}>

          {/* Role toggle */}
          <View style={styles.roleToggleWrap}>
            {(['passenger', 'enforcer']).map((r) => {
              const t      = ROLE[r];
              const active = role === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleBtn,
                    active
                      ? { backgroundColor: COLORS.dark, borderColor: COLORS.dark }
                      : { backgroundColor: 'transparent', borderColor: COLORS.border },
                  ]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleBtnLabel, active && styles.roleBtnLabelActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.cardTitle}>
            {role === 'passenger' ? 'Passenger Sign In' : 'Enforcer Sign In'}
          </Text>

          {/* USERNAME */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {role === 'enforcer' ? 'Username / Badge ID' : 'Username'}
            </Text>
            <View style={[styles.inputWrap, username && { borderColor: COLORS.primary }]}>
              <TextInput
                style={styles.input}
                placeholder={role === 'enforcer' ? 'e.g. PNP-Police' : 'Enter your username'}
                placeholderTextColor={COLORS.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* PASSWORD */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[styles.inputWrap, password && { borderColor: COLORS.primary }]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPwd(p => !p)} style={styles.peekBtn}>
                <Text style={styles.peekText}>{showPwd ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>
                  {role === 'enforcer' ? 'Log In to Dispatch' : 'Sign In'}
                </Text>
            }
          </TouchableOpacity>

        </Animated.View>

        {/* ── REGISTER LINK (passenger only) ────────────────────────────── */}
        {role === 'passenger' && (
          <Animated.View style={[styles.registerRow, { opacity: cardAnim }]}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.75}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </Animated.View>
        )}


      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#eff6ff' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },

  // LOGO
  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoImage:   { marginBottom: 10 },
  appTagline:  { fontSize: 12, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600' },

  // GLASS CARD
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius:    RADIUS.xl,
    padding:         28,
    marginBottom:    20,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.8)',
    ...SHADOW.md,
  },

  // ROLE TOGGLE
  roleToggleWrap: {
    flexDirection:   'row',
    borderRadius:    RADIUS.sm,
    borderWidth:     1,
    borderColor:     COLORS.border,
    backgroundColor: COLORS.pageBg,
    padding:         4,
    marginBottom:    22,
    gap:             4,
  },
  roleBtn: {
    flex:             1,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    paddingVertical:  9,
    borderRadius:     RADIUS.sm - 2,
    borderWidth:      1.5,
    gap:              6,
  },
  roleBtnLabel:       { fontSize: 13, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', color: COLORS.textSecondary },
  roleBtnLabelActive: { color: '#fff' },

  cardTitle: { fontSize: 20, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  cardSub:   { fontSize: 12, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', lineHeight: 18, marginBottom: 22 },

  // FIELDS
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 10, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.9, color: COLORS.textSecondary, marginBottom: 7,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: RADIUS.md, borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg, paddingHorizontal: 14, height: 52,
  },
  input:    { flex: 1, fontSize: 14, color: COLORS.textPrimary, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500' },
  peekBtn:  { paddingHorizontal: 6, paddingVertical: 4 },
  peekText: { fontSize: 12, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', color: COLORS.textSecondary },

  // SUBMIT
  submitBtn: {
    backgroundColor: COLORS.dark,
    borderRadius:    RADIUS.md,
    height:          54,
    justifyContent:  'center',
    alignItems:      'center',
    marginTop:       6,
    ...SHADOW.button,
    shadowColor:     COLORS.dark,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', letterSpacing: 0.3 },

  registerRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, marginBottom: 4 },
  registerText: { fontSize: 13, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', color: COLORS.textSecondary },
  registerLink: { fontSize: 13, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.primary },

  footer: {
    textAlign: 'center', color: COLORS.textMuted,
    fontSize: 11, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', lineHeight: 18, marginTop: 12,
  },
});
