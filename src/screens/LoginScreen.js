import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert, StatusBar, Animated, Easing,
} from 'react-native';
import { useAuth, getLastUsername } from '../context/AuthContext';
import { friendlyError } from '../api/errors';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS} from '../theme';
import Logo from '../components/Logo';

export default function LoginScreen({ navigation }) {
  const { login, pendingRole, roleSwitch } = useAuth();

  const [role,     setRole]     = useState(pendingRole || 'passenger');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const passwordRef = useRef(null);
  const usernameRef = useRef('');
  usernameRef.current = username;

  useEffect(() => {
    if (pendingRole) setRole(pendingRole);
  }, [pendingRole]);

  // ── Entry animations ────────────────────────────────────────────────────────
  const logoAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardY    = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(cardAnim, { toValue: 1, duration: 420, useNativeDriver: false }),
        Animated.spring(cardY,    { toValue: 0, friction: 8, tension: 60, useNativeDriver: false }),
      ]),
    ]).start();
    // safety: never leave the form invisible
    const t = setTimeout(() => { logoAnim.setValue(1); cardAnim.setValue(1); }, 1600);
    return () => clearTimeout(t);
  }, []);

  // ── Role switch animation ──────────────────────────────────────────────────
  // Pill slides under the chosen role, the role badge pops and turns,
  // and the form glides in from the side the role came from.
  const ROLES = ['passenger', 'enforcer'];
  const [toggleW, setToggleW] = useState(0);
  // Arriving from an in-app role switch: start the pill on the OLD role so it
  // visibly slides over to the new one right after the switch cover lifts.
  const cameFromSwitch = useRef(!!roleSwitch && !!pendingRole).current;
  const startRole = pendingRole || 'passenger';
  const pillX   = useRef(new Animated.Value(cameFromSwitch ? 1 - ROLES.indexOf(startRole) : ROLES.indexOf(startRole))).current;
  const badge   = useRef(new Animated.Value(1)).current;
  const formIn  = useRef(new Animated.Value(1)).current;
  const formDir = useRef(1);
  const firstRole = useRef(true);

  useEffect(() => {
    const i = ROLES.indexOf(role);
    const play = () => {
      formDir.current = i === 1 ? 1 : -1;
      badge.setValue(0);
      formIn.setValue(0);
      Animated.parallel([
        Animated.spring(pillX,  { toValue: i, tension: 90, friction: 11, useNativeDriver: false }),
        Animated.spring(badge,  { toValue: 1, tension: 80, friction: 6, useNativeDriver: false }),
        Animated.timing(formIn, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]).start();
    };
    let wait = 0;
    if (firstRole.current) {
      firstRole.current = false;
      if (!cameFromSwitch) { pillX.setValue(i); return undefined; }   // normal open: no slide
      wait = 750;   // let the switch cover lift first
    }
    const t1 = setTimeout(play, wait);
    // safety: never leave the form faded or the pill off its role
    const t2 = setTimeout(() => { badge.setValue(1); formIn.setValue(1); pillX.setValue(i); }, wait + 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [role]);   // eslint-disable-line react-hooks/exhaustive-deps

  const segW = toggleW > 0 ? (toggleW - 8 - 4) / 2 : 0;
  const formStyle = {
    opacity: formIn.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
    transform: [{ translateX: formIn.interpolate({ inputRange: [0, 1], outputRange: [22 * formDir.current, 0] }) }],
  };
  const badgeStyle = {
    transform: [
      { scale: badge.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
      { rotate: badge.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) },
    ],
  };

  const theme = ROLE[role];

  // Fill in the last username used for this role (only if the box is empty)
  useEffect(() => {
    let off = false;
    getLastUsername(role).then((u) => { if (!off && u && !usernameRef.current) setUsername(u); });
    setError('');
    return () => { off = true; };
  }, [role]);

  const handleLogin = async () => {
    if (loading) return;
    if (!username.trim() || !password.trim()) {
      setError('Enter your username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password, role);
    } catch (err) {
      const status = err?.response?.status;
      setError(status === 401
        ? 'Wrong username or password. Check them and try again.'
        : friendlyError(err, 'Sign-in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={COLORS.statusBar} backgroundColor={theme.gradFrom} />

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
          <View style={styles.roleToggleWrap} onLayout={(e) => setToggleW(e.nativeEvent.layout.width)}>
            {segW > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[styles.rolePill, {
                  width: segW,
                  transform: [{ translateX: pillX.interpolate({ inputRange: [0, 1], outputRange: [0, segW + 4] }) }],
                }]}
              />
            )}
            {ROLES.map((r) => {
              const t      = ROLE[r];
              const active = role === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={styles.roleBtn}
                  onPress={() => setRole(r)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.roleBtnLabel, active && styles.roleBtnLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Animated.View style={formStyle}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {role === 'passenger' ? 'Passenger sign in' : 'Enforcer sign in'}
              </Text>
              <Text style={styles.cardSub}>
                {role === 'passenger' ? 'See live seats before you board' : 'Dispatch and respond to violations'}
              </Text>
            </View>
          </View>

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
                onChangeText={(t) => { setUsername(t); if (error) setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </View>

          {/* PASSWORD */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[styles.inputWrap, password && { borderColor: COLORS.primary }]}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={(t) => { setPassword(t); if (error) setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                secureTextEntry={!showPwd}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPwd(p => !p)} style={styles.peekBtn}>
                <Text style={styles.peekText}>{showPwd ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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
  root:  { flex: 1, backgroundColor: COLORS.hoverBg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },

  // LOGO
  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoImage:   { marginBottom: 10 },
  appTagline:  { fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600' },

  // GLASS CARD
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.xl,
    padding:         24,
    marginBottom:    20,
    borderWidth:     1,
    borderColor:     COLORS.border,
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
    paddingVertical:  11,
    borderRadius:     RADIUS.sm - 2,
  },
  rolePill: {
    position: 'absolute', top: 4, bottom: 4, left: 4,
    borderRadius: RADIUS.sm - 2,
    backgroundColor: COLORS.primary,
    ...SHADOW.sm,
  },
  titleRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  roleBadge:     { width: 48, height: 48, borderRadius: 15, backgroundColor: '#C6F24E', alignItems: 'center', justifyContent: 'center' },
  roleBtnLabel:       { fontSize: 13, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textSecondary },
  roleBtnLabelActive: { color: '#fff' },

  cardTitle: { fontSize: 20, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  cardSub:   { fontSize: 12.5, color: COLORS.textSecondary, fontFamily: 'Outfit_Regular', fontWeight: '500', lineHeight: 18 },

  // FIELDS
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 10, fontFamily: 'Outfit_SemiBold', fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.9, color: COLORS.textSecondary, marginBottom: 7,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: RADIUS.md, borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg, paddingHorizontal: 14, height: 52,
  },
  input:    { flex: 1, fontSize: 14, color: COLORS.textPrimary, fontFamily: 'Outfit_Regular', fontWeight: '500' },
  peekBtn:  { paddingHorizontal: 6, paddingVertical: 4 },
  peekText: { fontSize: 12, fontFamily: 'Outfit_SemiBold', fontWeight: '600', color: COLORS.textSecondary },

  errorBox:  { backgroundColor: COLORS.dangerBg, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.dangerBorder, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 13, fontFamily: 'Outfit_SemiBold', fontWeight: '600', color: COLORS.textPrimary, lineHeight: 18 },

  // SUBMIT
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius:    RADIUS.md,
    height:          54,
    justifyContent:  'center',
    alignItems:      'center',
    marginTop:       6,
    ...SHADOW.button,
    shadowColor:     '#000',
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', letterSpacing: 0.3 },

  registerRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, marginBottom: 4 },
  registerText: { fontSize: 13, fontFamily: 'Outfit_Regular', fontWeight: '500', color: COLORS.textSecondary },
  registerLink: { fontSize: 13, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.primary },

  footer: {
    textAlign: 'center', color: COLORS.textMuted,
    fontSize: 11, fontFamily: 'Outfit_Regular', fontWeight: '500', lineHeight: 18, marginTop: 12,
  },
});
