import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, ScrollView, StatusBar, Animated, Easing,
} from 'react-native';
import { useAuth, getLastUsername } from '../context/AuthContext';
import { friendlyError } from '../api/errors';
import { useThemeMode } from '../context/ThemeContext';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS, TYPE, themed } from '../theme';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import { Field, Button } from '../components/ui';
import { GradientFill } from '../components/Gradient';
import useKeyboardScroll from '../hooks/useKeyboardScroll';

export default function LoginScreen({ navigation }) {
  const kb = useKeyboardScroll();          // keeps the box you type in above the keyboard
  const { login, pendingRole, roleSwitch } = useAuth();

  const [role,     setRole]     = useState(pendingRole || 'passenger');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const { dark, toggle: toggleTheme } = useThemeMode();
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
        : status === 429
        ? 'Too many wrong passwords. Please wait 15 minutes and try again.'
        : friendlyError(err, 'Sign-in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={COLORS.statusBar} backgroundColor={theme.gradFrom} />

      {/* Soft gradient background with color spots */}
      <GradientFill name="page" glow="light" start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} />

      {/* Light / dark switch */}
      <TouchableOpacity
        onPress={toggleTheme}
        style={styles.themeBtn}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <Icon name={dark ? 'sunny-outline' : 'moon-outline'} size={16} color={COLORS.textSecondary} />
        <Text style={styles.themeBtnText}>{dark ? 'Light' : 'Dark'}</Text>
      </TouchableOpacity>

      <ScrollView
        {...kb.scrollProps}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── LOGO (fades in first) ──────────────────────────────────────── */}
        <Animated.View style={[styles.logoSection, { opacity: logoAnim }]}>
          <Logo size="full" onDark={dark} style={styles.logoImage} />
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
              >
                <GradientFill name="button" />
              </Animated.View>
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
                  <Icon name={r === 'passenger' ? 'people-outline' : 'shield-checkmark-outline'} size={18} color={active ? '#fff' : COLORS.textSecondary} />
                  <Text style={[styles.roleBtnLabel, active && styles.roleBtnLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Animated.View style={formStyle}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {role === 'passenger' ? 'Welcome back' : 'Enforcer sign in'}
              </Text>
              <Text style={styles.cardSub}>
                {role === 'passenger' ? 'Sign in to see free seats before you ride.' : 'Sign in to see and respond to violations.'}
              </Text>
            </View>
          </View>

          {/* USERNAME */}
          <Field
            label={role === 'enforcer' ? 'Username or badge ID' : 'Username'}
            icon={role === 'enforcer' ? 'id-card-outline' : 'person-outline'}
            placeholder={role === 'enforcer' ? 'e.g. PNP-Police' : 'Enter your username'}
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

          {/* PASSWORD (eye button shows or hides it) */}
          <Field
            ref={passwordRef}
            label="Password"
            icon="lock-closed-outline"
            secure
            placeholder="Enter your password"
            value={password}
            onChangeText={(t) => { setPassword(t); if (error) setError(''); }}
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* SUBMIT */}
          <Button
            label={role === 'enforcer' ? 'Log in to Dispatch' : 'Sign in'}
            icon="arrow-forward"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: 6 }}
          />
          </Animated.View>

        </Animated.View>

        {/* ── REGISTER LINK (passenger only) ────────────────────────────── */}
        {role === 'passenger' && (
          <Animated.View style={[styles.registerRow, { opacity: cardAnim }]}>
            <Text style={styles.registerText}>New to MaxSeat? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.75}>
              <Text style={styles.registerLink}>Create an account</Text>
            </TouchableOpacity>
          </Animated.View>
        )}


        {/* Room under the form while the keyboard is open, so every box can scroll above it */}
        <View style={{ height: kb.height }} />
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  root:  { flex: 1, backgroundColor: COLORS.hoverBg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },

  // LOGO
  logoSection: { alignItems: 'center', marginBottom: 30 },
  logoImage:   { marginBottom: 10 },
  appTagline:  { fontSize: 13.5, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600' },

  // GLASS CARD
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.xl,
    padding:         26,
    marginBottom:    20,
    borderWidth:     1,
    borderColor:     COLORS.border,
    ...SHADOW.md,
  },

  // ROLE TOGGLE
  roleToggleWrap: {
    flexDirection:   'row',
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    backgroundColor: COLORS.pageBg,
    padding:         4,
    marginBottom:    24,
    gap:             4,
  },
  roleBtn: {
    flex:             1,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              8,
    paddingVertical:  13,
    borderRadius:     RADIUS.md - 4,
  },
  rolePill: {
    position: 'absolute', top: 4, bottom: 4, left: 4,
    borderRadius: RADIUS.md - 4,
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  titleRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  roleBadge:     { width: 48, height: 48, borderRadius: 15, backgroundColor: '#C6F24E', alignItems: 'center', justifyContent: 'center' },
  roleBtnLabel:       { fontSize: 16, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textSecondary },
  roleBtnLabelActive: { color: '#fff' },

  cardTitle: { ...TYPE.title, color: COLORS.textPrimary, marginBottom: 4 },
  cardSub:   { ...TYPE.body, color: COLORS.textSecondary },

  // FIELDS
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12, fontFamily: 'Outfit_SemiBold', fontWeight: '700', 
    letterSpacing: 0.9, color: COLORS.textSecondary, marginBottom: 7,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: RADIUS.md, borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg, paddingHorizontal: 14, height: 52,
  },
  input:    { flex: 1, fontSize: 15.5, color: COLORS.textPrimary, fontFamily: 'Outfit_Regular', fontWeight: '500' },
  peekBtn:  { paddingHorizontal: 6, paddingVertical: 4 },
  peekText: { fontSize: 13.5, fontFamily: 'Outfit_SemiBold', fontWeight: '600', color: COLORS.textSecondary },

  themeBtn:     { position: 'absolute', top: 48, right: 16, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 38, borderRadius: RADIUS.full, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.sm },
  themeBtnText: { fontSize: 15.5, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textSecondary },

  errorBox:  { backgroundColor: COLORS.dangerBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.dangerBorder, padding: 14, marginBottom: 14 },
  errorText: { fontSize: 14.5, fontFamily: 'Outfit_SemiBold', fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20 },

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
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', letterSpacing: 0.3 },

  registerRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, marginBottom: 4 },
  registerText: { fontSize: 15.5, fontFamily: 'Outfit_Regular', fontWeight: '500', color: COLORS.textSecondary },
  registerLink: { fontSize: 15.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.accent, paddingVertical: 6 },

  footer: {
    textAlign: 'center', color: COLORS.textMuted,
    fontSize: 12.5, fontFamily: 'Outfit_Regular', fontWeight: '500', lineHeight: 18, marginTop: 12,
  },
}));
