/**
 * RoleSwitchOverlay — full-screen transition when switching Passenger ⇄ Enforcer.
 *
 *   1. A forest-green circle grows from the middle of the screen and covers it.
 *   2. The role badge flips from the old role's icon to the new one.
 *   3. Behind the cover, the app signs out and opens sign-in with the new role.
 *   4. The cover fades and lifts away, revealing the sign-in screen.
 *
 * Safety: the overlay is removed by a timer even if an animation never reports
 * back, so it can never get stuck covering the app. All JS-driven.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../theme';

const { width: SW, height: SH } = Dimensions.get('window');
const D = Math.ceil(Math.hypot(SW, SH) * 1.1);   // circle big enough to cover any corner
const GREEN = '#2F6F5A';
const LIME = '#C6F24E';
const ICON = { passenger: '🚌', enforcer: '🛡' };
const LABEL = { passenger: 'Passenger', enforcer: 'Enforcer' };

export default function RoleSwitchOverlay({ active, from, to }) {
  const [mounted, setMounted] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const roles = useRef({ from, to });

  const grow  = useRef(new Animated.Value(0)).current;   // circle size
  const veil  = useRef(new Animated.Value(1)).current;   // whole overlay opacity (exit)
  const lift  = useRef(new Animated.Value(0)).current;   // content drift on exit
  const flip  = useRef(new Animated.Value(1)).current;   // badge horizontal squash for the flip
  const pop   = useRef(new Animated.Value(0.6)).current; // badge entrance

  useEffect(() => {
    if (active) {
      roles.current = { from, to };
      setShowTo(false);
      setMounted(true);
      grow.setValue(0); veil.setValue(1); lift.setValue(0); flip.setValue(1); pop.setValue(0.6);
      Animated.timing(grow, { toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      Animated.spring(pop, { toValue: 1, tension: 70, friction: 7, useNativeDriver: false }).start();
      // flip the badge to the new role half-way through
      const t1 = setTimeout(() => {
        Animated.timing(flip, { toValue: 0, duration: 140, useNativeDriver: false }).start(() => {
          setShowTo(true);
          Animated.spring(flip, { toValue: 1, tension: 90, friction: 7, useNativeDriver: false }).start();
        });
      }, 300);
      const t2 = setTimeout(() => setShowTo(true), 700);  // in case the flip callback never fires
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    if (!mounted) return undefined;
    Animated.parallel([
      Animated.timing(veil, { toValue: 0, duration: 360, easing: Easing.in(Easing.ease), useNativeDriver: false }),
      Animated.timing(lift, { toValue: 1, duration: 360, easing: Easing.in(Easing.ease), useNativeDriver: false }),
    ]).start(() => setMounted(false));
    const t = setTimeout(() => setMounted(false), 700);  // never leave the cover up
    return () => clearTimeout(t);
  }, [active]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;

  const { from: f, to: t } = roles.current;
  const role = showTo ? t : f;

  return (
    <Animated.View style={[styles.root, { opacity: veil }]} pointerEvents="auto">
      <Animated.View style={[styles.circle, {
        transform: [{ scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.01, 1] }) }],
      }]} />
      <Animated.View style={[styles.center, {
        transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) }],
      }]}>
        <Animated.View style={[styles.badge, { transform: [{ scale: pop }, { scaleX: flip }] }]}>
          <Text style={styles.badgeIcon}>{ICON[role] || '🚌'}</Text>
        </Animated.View>
        <Text style={styles.kicker}>{showTo ? 'Switching to' : 'Leaving'}</Text>
        <Text style={styles.title}>{LABEL[role] || ''} mode</Text>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: f === 'passenger' ? LIME : 'rgba(255,255,255,0.35)' }]} />
          <View style={styles.bar} />
          <View style={[styles.dot, { backgroundColor: t === 'passenger' ? LIME : 'rgba(255,255,255,0.35)' }]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root:   { ...StyleSheet.absoluteFillObject, zIndex: 10000, elevation: 10000, alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', width: D, height: D, borderRadius: D / 2, backgroundColor: GREEN, left: (SW - D) / 2, top: (SH - D) / 2 },
  center: { alignItems: 'center' },
  badge:  { width: 96, height: 96, borderRadius: 30, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  badgeIcon: { fontSize: 44 },
  kicker: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: FONTS.semiBold, marginBottom: 2 },
  title:  { color: '#FFFFFF', fontSize: 28, fontFamily: FONTS.extraBold },
  dots:   { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 8 },
  dot:    { width: 10, height: 10, borderRadius: 5 },
  bar:    { width: 36, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
});
