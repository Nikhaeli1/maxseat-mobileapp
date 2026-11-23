/**
 * OnboardingScreen — the first-time walkthrough for Passenger and Enforcer.
 *
 * Shown once per role right after the first sign-in, then the coach-mark tour
 * takes over on the dashboard.
 *
 * Every animation here is JS-driven (useNativeDriver: false). On the new
 * Android architecture a native-driven opacity can be reset to 0 by a
 * re-render, which made slides go blank. Nothing important ever starts
 * invisible: if an animation stalls, the content is still on screen.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOW, FONTS, IS_DARK } from '../theme';
import BusSeats from '../components/BusSeats';
import Icon from '../components/Icon';
import Logo from '../components/Logo';

const W = Dimensions.get('window').width;
const LIME = '#C6F24E';
const INK_ON_LIME = '#14211B';
const ease = Easing.out(Easing.cubic);

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────

// Counts up from `from` to `to`, one step every `ms`. Drives the live cabin demos.
function useTicker(from, to, ms = 380) {
  const [n, setN] = useState(from);
  useEffect(() => {
    setN(from);
    const t = setInterval(() => setN((v) => (v >= to ? v : v + 1)), ms);
    return () => clearInterval(t);
  }, [from, to, ms]);
  return n;
}

function useLoop(duration = 1600) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  return v;
}

// Card that springs in with a small scale. Never starts invisible.
function Stage({ children, style }) {
  const s = useRef(new Animated.Value(0.94)).current;
  useEffect(() => {
    Animated.spring(s, { toValue: 1, tension: 70, friction: 9, useNativeDriver: false }).start();
  }, [s]);
  return (
    <Animated.View style={[ui.stage, style, { transform: [{ scale: s }] }]}>
      {children}
    </Animated.View>
  );
}

function Chip({ label, kind }) {
  // kind: 'free' (outline) | 'near' (lime outline) | 'over' (solid lime)
  const look = kind === 'over'
    ? { backgroundColor: LIME, borderColor: LIME }
    : kind === 'near'
      ? { backgroundColor: 'transparent', borderColor: LIME }
      : { backgroundColor: 'transparent', borderColor: COLORS.border };
  return (
    <View style={[ui.chip, look]}>
      <Text style={[ui.chipTxt, { color: kind === 'over' ? INK_ON_LIME : COLORS.textPrimary }]}>{label}</Text>
    </View>
  );
}

function Feature({ icon, label }) {
  return (
    <View style={ui.feature}>
      <Icon name={icon} size={24} color={COLORS.primary} style={ui.featureIcon} />
      <Text style={ui.featureTxt}>{label}</Text>
    </View>
  );
}

// ─── PASSENGER SCENES ─────────────────────────────────────────────────────────

function P_Welcome() {
  return (
    <Stage style={{ alignItems: 'center', paddingVertical: 26 }}>
      <Logo size="full" />
      <Text style={ui.route}>Bugo – Igpit</Text>
      <View style={ui.featureRow}>
        <Feature icon="people-outline" label="Live seats" />
        <Feature icon="map-outline" label="Live map" />
        <Feature icon="megaphone-outline" label="Report" />
      </View>
    </Stage>
  );
}

function P_FindPuv() {
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(grow, { toValue: 1, duration: 900, easing: ease, useNativeDriver: false }).start();
  }, [grow]);
  const rows = [
    { plate: 'ABC 1234', route: 'Bugo – Igpit', load: 8,  kind: 'free', label: 'Seats free' },
    { plate: 'DEF 5678', route: 'Bugo – Igpit', load: 17, kind: 'near', label: 'Nearly full' },
    { plate: 'GHI 9012', route: 'Cogon – Gusa', load: 24, kind: 'over', label: 'Overloaded' },
  ];
  return (
    <Stage>
      {rows.map((r) => {
        const pct = Math.min(100, Math.round((r.load / 20) * 100));
        return (
          <View key={r.plate} style={ui.puvRow}>
            <View style={ui.rowTop}>
              <View>
                <Text style={ui.plate}>{r.plate}</Text>
                <Text style={ui.muted}>{r.route}</Text>
              </View>
              <Chip label={r.label} kind={r.kind} />
            </View>
            <View style={ui.barBg}>
              <Animated.View style={[ui.barFill, {
                backgroundColor: r.kind === 'free' ? COLORS.primary : LIME,
                width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${pct}%`] }),
              }]} />
            </View>
            <Text style={ui.small}>{r.load} / 20 riders</Text>
          </View>
        );
      })}
    </Stage>
  );
}

function P_LiveCabin() {
  const riders = useTicker(2, 12);
  return (
    <Stage style={{ alignItems: 'center', paddingVertical: 18 }}>
      <Text style={[ui.kicker, { marginBottom: 10 }]}>LIVE CABIN · ABC 1234</Text>
      <BusSeats passengers={riders} capacity={20} />
    </Stage>
  );
}

function P_LiveMap() {
  const move = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(move, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.delay(500),
      Animated.timing(move, { toValue: 0, duration: 0, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [move]);
  const trackW = W - 48 - 32 - 40;
  return (
    <Stage>
      <View style={ui.rowTop}>
        <Text style={ui.plate}>ABC 1234</Text>
        <View style={ui.etaPill}><Text style={ui.etaTxt}>3 min</Text></View>
      </View>
      <Text style={[ui.muted, { marginBottom: 22 }]}>Coming your way · 350 m</Text>
      <View style={ui.mapBox}>
        <View style={ui.routeLine} />
        <View style={[ui.stop, { left: 8 }]} />
        <View style={[ui.me, { right: 8 }]} />
        <Animated.View style={[ui.busPin, {
          transform: [{ translateX: move.interpolate({ inputRange: [0, 1], outputRange: [0, trackW - 30] }) }],
        }]}>
          <Text style={ui.busPinTxt}>8/20</Text>
        </Animated.View>
      </View>
      <View style={[ui.rowTop, { marginTop: 14 }]}>
        <Text style={ui.small}>Bugo</Text>
        <Text style={ui.small}>You</Text>
      </View>
    </Stage>
  );
}

function P_Report() {
  const pulse = useLoop(900);
  return (
    <Stage>
      <Text style={[ui.kicker, { marginBottom: 10 }]}>REPORT A PROBLEM</Text>
      {['Overloading', 'Reckless driving', 'Rude driver', 'Other'].map((t, i) => (
        <View key={t} style={[ui.option, i === 0 && ui.optionOn]}>
          <View style={[ui.radio, i === 0 && ui.radioOn]}>{i === 0 && <View style={ui.radioDot} />}</View>
          <Text style={ui.optionTxt}>{t}</Text>
        </View>
      ))}
      <Animated.View style={{ transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }] }}>
        <View style={ui.cta}><Text style={ui.ctaTxt}>Send report</Text></View>
      </Animated.View>
    </Stage>
  );
}

function P_Profile() {
  return (
    <Stage>
      <View style={[ui.rowTop, { justifyContent: 'flex-start', gap: 12, marginBottom: 14 }]}>
        <View style={ui.avatar}><Text style={ui.avatarTxt}>B</Text></View>
        <View>
          <Text style={ui.plate}>Bradley</Text>
          <Text style={ui.muted}>Passenger</Text>
        </View>
      </View>
      {[
        ['contrast-outline', 'Dark mode follows your phone'],
        ['shield-checkmark-outline', 'Switch to Enforcer mode'],
        ['play-circle-outline', 'Replay this guide'],
        ['log-out-outline', 'Log out'],
      ].map(([icon, label]) => (
        <View key={label} style={ui.menuRow}>
          <Icon name={icon} size={18} color={COLORS.primary} style={ui.menuIcon} />
          <Text style={ui.menuTxt}>{label}</Text>
        </View>
      ))}
    </Stage>
  );
}

// ─── ENFORCER SCENES ──────────────────────────────────────────────────────────

function E_Welcome() {
  return (
    <Stage style={{ alignItems: 'center', paddingVertical: 26 }}>
      <Logo size="full" />
      <Text style={ui.route}>Enforcer · Bugo – Igpit</Text>
      <View style={ui.featureRow}>
        <Feature icon="shield-checkmark-outline" label="Dispatch" />
        <Feature icon="bus-outline" label="Live cabin" />
        <Feature icon="create-outline" label="Log action" />
      </View>
    </Stage>
  );
}

function E_Dispatch() {
  const glow = useLoop(1100);
  return (
    <Stage>
      <Animated.View style={[ui.order, {
        borderColor: LIME, borderWidth: glow.interpolate({ inputRange: [0, 1], outputRange: [1.5, 3] }),
      }]}>
        <View style={ui.rowTop}>
          <Text style={ui.plate}>GHI 9012</Text>
          <View style={ui.critBadge}><Text style={ui.critTxt}>CRITICAL</Text></View>
        </View>
        <Text style={ui.muted}>0.6 km · Bulua terminal</Text>
        <View style={[ui.rowTop, { justifyContent: 'flex-start', gap: 6, marginTop: 8 }]}>
          <Chip label="24 / 20 riders" kind="over" />
          <Chip label="Cabin 38°C" kind="over" />
        </View>
      </Animated.View>
      <View style={ui.order}>
        <View style={ui.rowTop}>
          <Text style={ui.plate}>DEF 5678</Text>
          <Chip label="Warning" kind="near" />
        </View>
        <Text style={ui.muted}>1.1 km · CM Recto Ave</Text>
      </View>
    </Stage>
  );
}

function E_LiveCabin() {
  const riders = useTicker(18, 24, 520);
  return (
    <Stage style={{ alignItems: 'center', paddingVertical: 18 }}>
      <Text style={[ui.kicker, { marginBottom: 10 }]}>LIVE CABIN · GHI 9012</Text>
      <BusSeats passengers={riders} capacity={20} />
    </Stage>
  );
}

function E_Action() {
  const stamp = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.spring(stamp, { toValue: 1, tension: 60, friction: 6, useNativeDriver: false }).start();
    }, 900);
    return () => clearTimeout(t);
  }, [stamp]);
  return (
    <Stage>
      <Text style={[ui.kicker, { marginBottom: 10 }]}>CHOOSE ACTION · GHI 9012</Text>
      {[
        ['Warning', 'Ask 4 riders to transfer'],
        ['Ticket', 'Overloading fine · 2nd offense'],
        ['Hold the unit', 'Call it in, wait for backup'],
      ].map(([t, sub], i) => (
        <View key={t} style={[ui.option, i === 1 && ui.optionOn]}>
          <View style={[ui.radio, i === 1 && ui.radioOn]}>{i === 1 && <View style={ui.radioDot} />}</View>
          <View>
            <Text style={ui.optionTxt}>{t}</Text>
            <Text style={ui.small}>{sub}</Text>
          </View>
        </View>
      ))}
      <View style={{ alignItems: 'center', marginTop: 6, height: 34, justifyContent: 'center' }}>
        <Animated.View style={[ui.logged, { transform: [{ scale: stamp.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
          <Text style={ui.loggedTxt}>Response logged</Text>
        </Animated.View>
      </View>
    </Stage>
  );
}

function E_Map() {
  const ring = useLoop(800);
  const PINS = [8, 30, 52, 74, 92];
  return (
    <Stage>
      <View style={ui.rowTop}>
        <Text style={ui.plate}>Live map</Text>
        <Chip label="5 PUVs" kind="free" />
      </View>
      <Text style={[ui.muted, { marginBottom: 26 }]}>Flagged PUVs pulse in lime</Text>
      <View style={ui.mapBox}>
        <View style={ui.routeLine} />
        {PINS.map((pct, i) => {
          const flagged = i === 2;
          return (
            <View key={pct} style={[ui.pinWrap, { left: `${pct}%` }]}>
              {flagged && (
                <Animated.View style={[ui.pulse, {
                  transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
                  opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
                }]} />
              )}
              <View style={[ui.pin, flagged && { backgroundColor: LIME, borderColor: INK_ON_LIME }]} />
            </View>
          );
        })}
      </View>
      <View style={[ui.rowTop, { justifyContent: 'flex-start', gap: 16, marginTop: 18 }]}>
        <View style={ui.legend}><View style={[ui.legendDot, { backgroundColor: COLORS.primary }]} /><Text style={ui.small}>Normal</Text></View>
        <View style={ui.legend}><View style={[ui.legendDot, { backgroundColor: LIME }]} /><Text style={ui.small}>Needs action</Text></View>
      </View>
    </Stage>
  );
}

function E_Habits() {
  return (
    <Stage>
      {[
        ['create-outline', 'Log every response', 'Complete records protect you and the riders'],
        ['refresh-outline', 'Refresh often', 'The list also updates by itself every few seconds'],
        ['map-outline', 'Use the map', 'Spot flagged PUVs near you fast'],
        ['log-out-outline', 'Log out after your shift', 'Keeps dispatch records accurate'],
      ].map(([icon, t, sub]) => (
        <View key={t} style={ui.menuRow}>
          <Icon name={icon} size={18} color={COLORS.primary} style={ui.menuIcon} />
          <View style={{ flex: 1 }}>
            <Text style={ui.optionTxt}>{t}</Text>
            <Text style={ui.small}>{sub}</Text>
          </View>
        </View>
      ))}
    </Stage>
  );
}

// ─── SLIDES ───────────────────────────────────────────────────────────────────

const PASSENGER_SLIDES = [
  { Scene: P_Welcome,   title: 'Maayong adlaw! Welcome to MaxSeat', sub: 'See how full each PUV is before it reaches your stop on the Bugo – Igpit route.' },
  { Scene: P_FindPuv,   title: 'Find a PUV',             sub: 'A plain outline means seats are free. More lime means it is getting full. Solid lime means overloaded.' },
  { Scene: P_LiveCabin, title: 'See inside, live',       sub: 'Tap a PUV to see its live cabin. Each person is a rider. Lime people are standing because every seat is taken.' },
  { Scene: P_LiveMap,   title: 'Follow it on the map',   sub: 'Watch your PUV move in real time and see how many minutes until it reaches you.' },
  { Scene: P_Report,    title: 'Report a problem',       sub: 'Overloaded or reckless? Send a report in a few taps. It goes straight to enforcers.' },
  { Scene: P_Profile,   title: 'Make it yours',          sub: 'Dark mode follows your phone. Switch to Enforcer mode or replay this guide from Profile.' },
];

const ENFORCER_SLIDES = [
  { Scene: E_Welcome,   title: 'Welcome, enforcer',          sub: 'MaxSeat shows you which PUVs need attention on the Bugo – Igpit route, live.' },
  { Scene: E_Dispatch,  title: 'Your dispatch board',        sub: 'Violations are sorted by how serious they are. Solid lime means critical. Tap one to respond.' },
  { Scene: E_LiveCabin, title: 'See inside before you act',  sub: 'The live cabin view shows every seat. Lime people are standing riders over the limit.' },
  { Scene: E_Action,    title: 'Log your action',            sub: 'Choose warning, ticket or hold, add a photo, then submit. The time is saved for you.' },
  { Scene: E_Map,       title: 'Watch the whole route',      sub: 'Map view shows every PUV live. The ones that need action pulse in lime.' },
  { Scene: E_Habits,    title: 'Good habits',                sub: 'Log every response, refresh often, and log out when your shift ends.' },
];

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { user, completeOnboarding } = useAuth();
  const role   = user?.role || 'passenger';
  const slides = role === 'enforcer' ? ENFORCER_SLIDES : PASSENGER_SLIDES;

  const [idx, setIdx] = useState(0);
  const busy = useRef(false);

  // JS-driven slide transition. Values only dip briefly; if anything stalls,
  // the end state is visible because every value rests at "shown".
  const fade = useRef(new Animated.Value(1)).current;
  const dx   = useRef(new Animated.Value(0)).current;

  const goTo = (next) => {
    if (busy.current || next === idx || next < 0 || next >= slides.length) return;
    busy.current = true;
    const dir = next > idx ? 1 : -1;
    Animated.parallel([
      Animated.timing(fade, { toValue: 0.15, duration: 140, useNativeDriver: false }),
      Animated.timing(dx,   { toValue: -24 * dir, duration: 140, easing: ease, useNativeDriver: false }),
    ]).start(() => {
      setIdx(next);
      dx.setValue(28 * dir);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: false }),
        Animated.spring(dx,   { toValue: 0, tension: 80, friction: 11, useNativeDriver: false }),
      ]).start();
      busy.current = false;
    });
    // Safety net: never leave the slide half faded
    setTimeout(() => { busy.current = false; fade.setValue(1); }, 900);
  };

  const finish = () => completeOnboarding(role);
  const { Scene, title, sub } = slides[idx];
  const isLast = idx === slides.length - 1;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={COLORS.statusBar} backgroundColor={COLORS.pageBg} />

      <View style={styles.topBar}>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillTxt}>{role === 'enforcer' ? 'Enforcer' : 'Passenger'}</Text>
        </View>
        {!isLast ? (
          <TouchableOpacity onPress={finish} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        ) : <View />}
      </View>

      <Animated.View style={[styles.sceneArea, { opacity: fade, transform: [{ translateX: dx }] }]}>
        <Scene key={idx} />
      </Animated.View>

      <Animated.View style={[styles.textArea, { opacity: fade }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}>
              <View style={[styles.dot, i === idx ? styles.dotOn : null]} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {idx > 0 && (
            <TouchableOpacity onPress={() => goTo(idx - 1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.back}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextBtn} onPress={isLast ? finish : () => goTo(idx + 1)} activeOpacity={0.85}>
            <Text style={styles.nextTxt}>{isLast ? 'Get started' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const ui = StyleSheet.create({
  stage: {
    width: W - 48, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl, padding: 16,
    borderWidth: IS_DARK ? 1 : 0, borderColor: COLORS.border, ...SHADOW.md,
  },
  route:      { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginTop: 6, marginBottom: 18 },
  featureRow: { flexDirection: 'row', gap: 10 },
  feature:    { alignItems: 'center', backgroundColor: COLORS.pageBg, borderRadius: RADIUS.md, paddingVertical: 12, width: (W - 48 - 32 - 20) / 3 },
  featureIcon:{ marginBottom: 6 },
  featureTxt: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },

  kicker:  { fontSize: 11, fontFamily: FONTS.extraBold, letterSpacing: 1, color: COLORS.textSecondary },
  rowTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plate:   { fontSize: 16, fontFamily: FONTS.extraBold, color: COLORS.textPrimary },
  muted:   { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  small:   { fontSize: 11.5, fontFamily: FONTS.regular, color: COLORS.textSecondary },

  chip:    { borderWidth: 1.5, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  chipTxt: { fontSize: 11, fontFamily: FONTS.extraBold },

  puvRow:  { backgroundColor: COLORS.pageBg, borderRadius: RADIUS.md, padding: 12, marginBottom: 8 },
  barBg:   { height: 7, borderRadius: 4, backgroundColor: COLORS.border, overflow: 'hidden', marginTop: 10, marginBottom: 5 },
  barFill: { height: 7, borderRadius: 4 },

  etaPill: { backgroundColor: LIME, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  etaTxt:  { fontSize: 13, fontFamily: FONTS.extraBold, color: INK_ON_LIME },
  mapBox:  { height: 34, justifyContent: 'center', marginHorizontal: 4 },
  routeLine: { position: 'absolute', left: 0, right: 0, height: 5, borderRadius: 3, backgroundColor: COLORS.primary },
  stop:    { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.cardBg, borderWidth: 3, borderColor: COLORS.primary },
  me:      { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primary, borderWidth: 4, borderColor: COLORS.cardBg },
  busPin:  { position: 'absolute', left: 4, backgroundColor: COLORS.primary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 2, borderColor: LIME },
  busPinTxt: { fontSize: 11, fontFamily: FONTS.extraBold, color: '#FFFFFF' },

  option:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, padding: 10, marginBottom: 7 },
  optionOn:  { borderColor: LIME, backgroundColor: IS_DARK ? 'rgba(198,242,78,0.10)' : 'rgba(198,242,78,0.16)' },
  radio:     { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioOn:   { borderColor: COLORS.primary },
  radioDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  optionTxt: { fontSize: 13.5, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },
  cta:       { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 42, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  ctaTxt:    { color: '#FFFFFF', fontSize: 14, fontFamily: FONTS.extraBold },

  avatar:    { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.extraBold },
  menuRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  menuIcon:  { width: 22, textAlign: 'center' },
  menuTxt:   { fontSize: 13.5, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },

  order:     { backgroundColor: COLORS.pageBg, borderRadius: RADIUS.md, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: COLORS.pageBg },
  critBadge: { backgroundColor: LIME, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  critTxt:   { fontSize: 10, fontFamily: FONTS.extraBold, letterSpacing: 0.8, color: INK_ON_LIME },
  logged:    { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8 },
  loggedTxt: { color: '#FFFFFF', fontSize: 12.5, fontFamily: FONTS.extraBold },

  pinWrap:   { position: 'absolute', width: 18, height: 18, marginLeft: -9, alignItems: 'center', justifyContent: 'center' },
  pin:       { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: COLORS.cardBg },
  pulse:     { position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: LIME },
  legend:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
});

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: COLORS.pageBg },
  topBar:    { paddingTop: 52, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rolePill:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  rolePillTxt: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },
  skip:      { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },

  sceneArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  textArea:  { paddingHorizontal: 28, paddingTop: 12 },
  title:     { fontSize: 24, fontFamily: FONTS.extraBold, color: COLORS.textPrimary, marginBottom: 8, lineHeight: 30 },
  sub:       { fontSize: 14.5, fontFamily: FONTS.regular, color: COLORS.textSecondary, lineHeight: 21.5 },

  footer:    { paddingHorizontal: 28, paddingBottom: 40, paddingTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dots:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.border },
  dotOn:     { width: 22, backgroundColor: COLORS.primary },
  back:      { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  nextBtn:   { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 26, height: 48, justifyContent: 'center', alignItems: 'center', ...SHADOW.button },
  nextTxt:   { color: '#FFFFFF', fontSize: 15, fontFamily: FONTS.extraBold },
});
