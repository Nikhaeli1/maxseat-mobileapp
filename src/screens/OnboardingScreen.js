/**
 * OnboardingScreen — animated tutorial for Passenger & Enforcer roles.
 *
 * Architecture:
 * - currentIdx controls which slide is shown
 * - slide transition: fade-out left → fade-in right  (opacity + translateX, native driver)
 * - per-slide illustration: scale + fade on mount (one Animated.Value per slide)
 * - no external packages — pure React Native Animated API
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOW } from '../theme';

const W = Dimensions.get('window').width;
const ease = Easing.out(Easing.cubic);

// ─── ILLUSTRATION WRAPPER ─────────────────────────────────────────────────────
// Gives every slide a consistent animated entry (scale + fade) when it mounts.

function Illustration({ bgColor, children }) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 75, friction: 9, useNativeDriver: true }),
      Animated.timing(fade,  { toValue: 1, duration: 350, easing: ease, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[il.wrap, { backgroundColor: bgColor }]}>
      <Animated.View style={{ transform: [{ scale }], opacity: fade }}>
        {children}
      </Animated.View>
    </View>
  );
}

// ─── SHARED MINI-UI PIECES ────────────────────────────────────────────────────

function CapBar({ pct, color }) {
  return (
    <View style={mu.barBg}>
      <View style={[mu.barFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

function Pill({ label, color, bg }) {
  return (
    <View style={[mu.pill, { backgroundColor: bg, borderColor: color + '60' }]}>
      <View style={[mu.pillDot, { backgroundColor: color }]} />
      <Text style={[mu.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function MiniCard({ children, style }) {
  return <View style={[mu.card, style]}>{children}</View>;
}

function Row({ children, style }) {
  return <View style={[mu.row, style]}>{children}</View>;
}

function Label({ children, style }) {
  return <Text style={[mu.label, style]}>{children}</Text>;
}

function Value({ children, style }) {
  return <Text style={[mu.value, style]}>{children}</Text>;
}

// ─── PASSENGER SLIDES ─────────────────────────────────────────────────────────

function P0_Welcome() {
  return (
    <Illustration bgColor="#eff6ff">
      <MiniCard style={il.centeredCard}>
        <View style={il.brandRow}>
          <View style={[il.brandDot, { backgroundColor: COLORS.primary }]} />
          <Text style={il.brandName}>MaxSeat</Text>
        </View>
        <Text style={il.brandTagline}>Bugo – Igpit Route</Text>
        <View style={il.statChips}>
          {[
            { label: 'Live PUVs',   color: COLORS.primary },
            { label: 'Real-Time',   color: COLORS.success },
            { label: 'Smart Alerts',color: COLORS.warning },
          ].map(({ label, color }) => (
            <View key={label} style={[il.chip, { backgroundColor: color + '18', borderColor: color + '50' }]}>
              <Text style={[il.chipText, { color }]}>{label}</Text>
            </View>
          ))}
        </View>
      </MiniCard>
    </Illustration>
  );
}

function P1_HomeScreen() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.35, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <Illustration bgColor="#f0fdf4">
      <MiniCard>
        {/* Search bar mock */}
        <Row style={{ marginBottom: 12 }}>
          <View style={mu.searchBar}>
            <Label style={{ color: COLORS.textMuted }}>Search plate, route…</Label>
          </View>
        </Row>

        {/* PUV card 1 */}
        <View style={mu.puvCard}>
          <Row style={{ marginBottom: 6 }}>
            <Value style={{ flex: 1 }}>CDO – 001 – AB</Value>
            <Pill label="AVAILABLE" color="#16a34a" bg="#dcfce7" />
          </Row>
          <CapBar pct={58} color="#16a34a" />
          <Row style={{ marginTop: 5 }}>
            <Label>12 / 20 passengers</Label>
            <Value style={{ color: '#16a34a' }}>58%</Value>
          </Row>
        </View>

        {/* PUV card 2 */}
        <View style={[mu.puvCard, { borderLeftWidth: 3, borderLeftColor: COLORS.danger }]}>
          <Row style={{ marginBottom: 6 }}>
            <Value style={{ flex: 1 }}>CDO – 023 – CD</Value>
            <Pill label="OVERLOADED" color={COLORS.danger} bg={COLORS.dangerBg} />
          </Row>
          <CapBar pct={100} color={COLORS.danger} />
          <Row style={{ marginTop: 5 }}>
            <Label>22 / 20 passengers</Label>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Value style={{ color: COLORS.danger }}>110%</Value>
            </Animated.View>
          </Row>
        </View>
      </MiniCard>
    </Illustration>
  );
}

function P2_Capacity() {
  const barW  = useRef(new Animated.Value(0)).current;
  const textO = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(barW, { toValue: 1, duration: 900, easing: ease, useNativeDriver: true }),
      Animated.timing(textO, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const SEATS = Array.from({ length: 20 }, (_, i) => i < 14);

  return (
    <Illustration bgColor="#fefce8">
      <MiniCard>
        <Label style={{ marginBottom: 8 }}>CDO – 045 · Capacity</Label>
        {/* Animated bar */}
        <View style={[mu.barBg, { height: 12, borderRadius: 6, marginBottom: 8 }]}>
          <Animated.View style={[
            mu.barFill,
            { height: 12, borderRadius: 6, backgroundColor: COLORS.warning, transform: [{ scaleX: barW }] },
          ]} />
        </View>
        <Row style={{ marginBottom: 14 }}>
          <Label>14 / 20 passengers</Label>
          <Animated.Text style={[mu.value, { color: COLORS.warning, opacity: textO }]}>70%</Animated.Text>
        </Row>
        {/* Seat grid */}
        <View style={il.seatGrid}>
          {SEATS.map((filled, i) => (
            <View key={i} style={[il.seat, filled ? il.seatFilled : il.seatEmpty]} />
          ))}
        </View>
        <Animated.Text style={[mu.label, { textAlign: 'center', marginTop: 8, opacity: textO }]}>
          6 seats remaining
        </Animated.Text>
      </MiniCard>
    </Illustration>
  );
}

function P3_PuvDetail() {
  return (
    <Illustration bgColor="#f0f9ff">
      <MiniCard>
        <Row style={{ marginBottom: 10 }}>
          <Value style={{ fontSize: 15, flex: 1 }}>CDO – 001 – AB</Value>
          <Pill label="AVAILABLE" color="#16a34a" bg="#dcfce7" />
        </Row>

        {[
          ['Driver',   'Juan Dela Cruz'],
          ['Route',    'Bugo – Igpit'],
          ['Company',  'CDO Transit Co.'],
          ['Location', 'Near Shell CDO'],
        ].map(([k, v]) => (
          <Row key={k} style={{ paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Label style={{ width: 64 }}>{k}</Label>
            <Value style={{ flex: 1 }}>{v}</Value>
          </Row>
        ))}

        <TouchableOpacity style={[il.actionBtn, { backgroundColor: COLORS.primary, marginTop: 12 }]}>
          <Text style={il.actionBtnText}>Report an Issue</Text>
        </TouchableOpacity>
      </MiniCard>
    </Illustration>
  );
}

function P4_Report() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.04, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <Illustration bgColor="#fdf4ff">
      <MiniCard>
        <Label style={{ marginBottom: 10 }}>Report a Violation</Label>

        {['Overloading', 'Route Deviation', 'Driver Misconduct', 'Other'].map((type, i) => (
          <View key={type} style={[mu.checkRow, i === 0 && { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow }]}>
            <View style={[mu.checkBox, i === 0 && { backgroundColor: COLORS.primary }]}>
              {i === 0 && <Text style={{ color: '#fff', fontSize: 8, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' }}>✓</Text>}
            </View>
            <Label style={i === 0 ? { color: COLORS.primary } : {}}>{type}</Label>
          </View>
        ))}

        <Animated.View style={{ transform: [{ scale: pulse }], marginTop: 12 }}>
          <View style={[il.actionBtn, { backgroundColor: COLORS.primary }]}>
            <Text style={il.actionBtnText}>Submit Report</Text>
          </View>
        </Animated.View>
      </MiniCard>
    </Illustration>
  );
}

function P5_Profile() {
  return (
    <Illustration bgColor="#f1f5f9">
      <MiniCard>
        {/* Avatar row */}
        <Row style={{ gap: 10, marginBottom: 14 }}>
          <View style={il.avatar}>
            <Text style={il.avatarText}>M</Text>
          </View>
          <View>
            <Value style={{ fontSize: 13 }}>Maria Santos</Value>
            <Label style={{ color: COLORS.primary }}>@maria_santos</Label>
          </View>
        </Row>

        {[
          { label: 'Update Mobile Number',  icon: '📱' },
          { label: 'Change Password',       icon: '🔒' },
          { label: 'Switch to Enforcer',    icon: '🛡' },
          { label: 'Replay Tutorial',       icon: '▶' },
          { label: 'Log Out',               icon: '⏻', danger: true },
        ].map(({ label, icon, danger }) => (
          <Row key={label} style={[mu.menuRow, danger && { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 6, paddingTop: 10 }]}>
            <Text style={{ fontSize: 12, width: 20 }}>{icon}</Text>
            <Label style={danger ? { color: COLORS.danger } : {}}>{label}</Label>
          </Row>
        ))}
      </MiniCard>
    </Illustration>
  );
}

// ─── ENFORCER SLIDES ──────────────────────────────────────────────────────────

function E0_Welcome() {
  const pulse = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.9,  duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <Illustration bgColor="#fff1f2">
      <MiniCard style={il.centeredCard}>
        <View style={il.brandRow}>
          <View style={[il.brandDot, { backgroundColor: COLORS.danger }]} />
          <Text style={il.brandName}>MaxSeat</Text>
        </View>
        <Text style={il.brandTagline}>Enforcer Dashboard</Text>
        <Animated.View style={[il.critBadge, { transform: [{ scale: pulse }] }]}>
          <Text style={il.critBadgeText}>DISPATCH ACTIVE</Text>
        </Animated.View>
        <View style={il.statChips}>
          {[
            { label: 'Monitor',   color: COLORS.danger  },
            { label: 'Intercept', color: COLORS.warning },
            { label: 'Log',       color: COLORS.primary },
          ].map(({ label, color }) => (
            <View key={label} style={[il.chip, { backgroundColor: color + '18', borderColor: color + '50' }]}>
              <Text style={[il.chipText, { color }]}>{label}</Text>
            </View>
          ))}
        </View>
      </MiniCard>
    </Illustration>
  );
}

function E1_DispatchList() {
  return (
    <Illustration bgColor="#fff7ed">
      <MiniCard>
        <Label style={{ marginBottom: 10 }}>2 Active Violations · Bugo–Igpit</Label>

        {/* Violation card 1 — critical */}
        <View style={[mu.puvCard, { borderLeftWidth: 3, borderLeftColor: COLORS.danger, marginBottom: 10 }]}>
          <Row style={{ marginBottom: 4 }}>
            <Value style={{ flex: 1, color: COLORS.textPrimary }}>CDO – 023</Value>
            <View style={[mu.pill, { backgroundColor: COLORS.dangerBg, borderColor: COLORS.danger + '60' }]}>
              <Text style={[mu.pillText, { color: COLORS.danger }]}>CRITICAL</Text>
            </View>
          </Row>
          <Label>Overloading · 22 / 20 pax</Label>
          <Label style={{ color: COLORS.textMuted, marginTop: 2 }}>Near Shell CDO</Label>
        </View>

        {/* Violation card 2 */}
        <View style={[mu.puvCard, { borderLeftWidth: 3, borderLeftColor: COLORS.warning }]}>
          <Row style={{ marginBottom: 4 }}>
            <Value style={{ flex: 1 }}>CDO – 045</Value>
            <View style={[mu.pill, { backgroundColor: '#fef3c7', borderColor: COLORS.warning + '60' }]}>
              <Text style={[mu.pillText, { color: COLORS.warning }]}>WARNING</Text>
            </View>
          </Row>
          <Label>Elevated Temp · 38.5°C</Label>
          <Label style={{ color: COLORS.textMuted, marginTop: 2 }}>Igpit Terminal</Label>
        </View>

        <Label style={{ color: COLORS.primary, textAlign: 'right', marginTop: 8 }}>Tap a card to respond →</Label>
      </MiniCard>
    </Illustration>
  );
}

function E2_ActionScreen() {
  const stamp = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.spring(stamp, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
    }, 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <Illustration bgColor="#f0fdf4">
      <MiniCard>
        <Row style={{ marginBottom: 10 }}>
          <Value>CDO – 023 – AB</Value>
          <View style={[mu.pill, { backgroundColor: COLORS.dangerBg, borderColor: COLORS.danger + '60' }]}>
            <Text style={[mu.pillText, { color: COLORS.danger }]}>CRITICAL</Text>
          </View>
        </Row>

        {[
          ['Violation',  'Overloading'],
          ['Action',     'Issue Warning'],
          ['Fine',       '₱500.00'],
          ['Officer',    'Lt. Reyes'],
        ].map(([k, v]) => (
          <Row key={k} style={{ paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Label style={{ width: 64 }}>{k}</Label>
            <Value style={{ flex: 1 }}>{v}</Value>
          </Row>
        ))}

        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <Animated.View style={[il.loggedBadge, { transform: [{ scale: stamp }] }]}>
            <Text style={il.loggedText}>RESPONSE LOGGED</Text>
          </Animated.View>
        </View>
      </MiniCard>
    </Illustration>
  );
}

function E3_MapView() {
  const dots = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  const ring = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.stagger(200, dots.map(a =>
      Animated.spring(a, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true })
    )).start(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(ring, { toValue: 1.8, duration: 800, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 1,   duration: 0,   useNativeDriver: true }),
        Animated.delay(600),
      ])).start();
    });
  }, []);

  const DOT_POS = [5, 24, 47, 69, 88];

  return (
    <Illustration bgColor="#eff6ff">
      <MiniCard>
        <Row style={{ marginBottom: 6 }}>
          <Value>Live Map · Bugo–Igpit</Value>
          <View style={[mu.pill, { backgroundColor: COLORS.successBg, borderColor: COLORS.success + '60' }]}>
            <View style={[mu.pillDot, { backgroundColor: COLORS.success }]} />
            <Text style={[mu.pillText, { color: COLORS.success }]}>LIVE</Text>
          </View>
        </Row>
        <Label style={{ marginBottom: 16 }}>5 active PUVs on route</Label>

        {/* Route track */}
        <View style={il.routeWrap}>
          {/* Route line */}
          <View style={il.routeLine} />
          {/* Station dots */}
          <View style={[il.stationDot, { left: '0%' }]} />
          <View style={[il.stationDot, { left: '96%' }]} />

          {/* PUV markers */}
          {DOT_POS.map((pct, i) => {
            const isAlert = i === 2;
            return (
              <Animated.View
                key={i}
                style={[
                  il.puvDot,
                  isAlert && { backgroundColor: COLORS.danger },
                  { left: `${pct}%`, opacity: dots[i], transform: [{ scale: dots[i] }] },
                ]}
              >
                {isAlert && (
                  <Animated.View style={[
                    il.puvRing,
                    {
                      transform: [{ scale: ring }],
                      opacity: ring.interpolate({ inputRange: [1, 1.8], outputRange: [0.8, 0] }),
                    },
                  ]} />
                )}
              </Animated.View>
            );
          })}
        </View>

        <Row style={{ marginTop: 18 }}>
          {[
            { color: COLORS.primary, label: 'Normal' },
            { color: COLORS.danger,  label: 'Alert' },
          ].map(({ color, label }) => (
            <Row key={label} style={{ gap: 5, alignItems: 'center', marginRight: 16 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
              <Label>{label}</Label>
            </Row>
          ))}
        </Row>
      </MiniCard>
    </Illustration>
  );
}

function E4_LogOut() {
  return (
    <Illustration bgColor="#f8fafc">
      <MiniCard>
        <Label style={{ marginBottom: 12 }}>Enforcer Best Practices</Label>

        {[
          { icon: '📋', title: 'Log every violation',   detail: 'Fill in all fields before submitting' },
          { icon: '🗺',  title: 'Use Map view',          detail: 'Monitor PUV positions across the route' },
          { icon: '🔄',  title: 'Refresh regularly',     detail: 'Pull down on list to get latest data' },
          { icon: '⏻',  title: 'Log out after shift',   detail: 'Keeps dispatch records accurate' },
        ].map(({ icon, title, detail }) => (
          <Row key={title} style={{ gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 16, width: 22 }}>{icon}</Text>
            <View style={{ flex: 1 }}>
              <Value style={{ fontSize: 12, marginBottom: 1 }}>{title}</Value>
              <Label style={{ lineHeight: 14 }}>{detail}</Label>
            </View>
          </Row>
        ))}
      </MiniCard>
    </Illustration>
  );
}

// ─── SLIDE DEFINITIONS ────────────────────────────────────────────────────────

const PASSENGER_SLIDES = [
  { Scene: P0_Welcome,  title: 'Welcome to MaxSeat',           sub: 'Your smart commute companion for the Bugo–Igpit corridor. Let\'s show you around.' },
  { Scene: P1_HomeScreen, title: 'Track Every Bus Live',       sub: 'The Home tab shows all active PUVs with live capacity, route, and driver info. Pull down to refresh.' },
  { Scene: P2_Capacity, title: 'Know Before You Board',        sub: 'Each card shows a real-time capacity bar. Green = seats available, yellow = nearly full, red = overloaded.' },
  { Scene: P3_PuvDetail, title: 'Tap for Full PUV Details',   sub: 'Tap any PUV card to see the driver, company, exact location, and an option to report directly from that screen.' },
  { Scene: P4_Report,   title: 'Report Issues Instantly',      sub: 'Use the Reports tab to flag overloading, route deviations, or misconduct. Your report goes straight to enforcers.' },
  { Scene: P5_Profile,  title: 'Manage Your Account',          sub: 'Update your mobile number, change your password, replay this tutorial, or switch to enforcer mode from the Profile tab.' },
];

const ENFORCER_SLIDES = [
  { Scene: E0_Welcome,      title: 'MaxSeat Dispatch Dashboard', sub: 'Monitor all PUVs on the Bugo–Igpit route and respond to violations in real time.' },
  { Scene: E1_DispatchList, title: 'View Active Violations',     sub: 'Dispatch orders are sorted by severity. Critical violations (overloading) appear in red. Tap any card to act.' },
  { Scene: E2_ActionScreen, title: 'Log Your Response',          sub: 'Fill in violation type, action taken, fine amount, and remarks, then submit. The log is time-stamped automatically.' },
  { Scene: E3_MapView,      title: 'Monitor the Route on Map',   sub: 'Switch to Map view in Dispatch to see every PUV\'s live position. Red markers indicate flagged vehicles.' },
  { Scene: E4_LogOut,       title: 'Enforcer Best Practices',    sub: 'Log every violation fully, refresh the dispatch list regularly, and always log out when your shift ends.' },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { user, completeOnboarding } = useAuth();

  const role   = user?.role || 'passenger';
  const slides = role === 'passenger' ? PASSENGER_SLIDES : ENFORCER_SLIDES;
  const accent = role === 'passenger' ? COLORS.primary : COLORS.danger;

  const [idx, setIdx] = useState(0);

  // Slide transition values (shared)
  const slideOp = useRef(new Animated.Value(1)).current;
  const slideX  = useRef(new Animated.Value(0)).current;

  // Bottom text fade
  const textOp = useRef(new Animated.Value(1)).current;
  const textY  = useRef(new Animated.Value(0)).current;

  const goTo = (next) => {
    Animated.parallel([
      Animated.timing(slideOp, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideX,  { toValue: -28, duration: 160, easing: ease, useNativeDriver: true }),
      Animated.timing(textOp,  { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setIdx(next);
      slideX.setValue(36);
      textY.setValue(10);
      Animated.parallel([
        Animated.timing(slideOp, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(slideX,  { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(textOp,  { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(textY,   { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (idx < slides.length - 1) goTo(idx + 1);
    else completeOnboarding(role);
  };

  const handleSkip = () => completeOnboarding(role);

  const { Scene, title, sub } = slides[idx];
  const isLast = idx === slides.length - 1;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Step counter */}
      <View style={styles.stepRow}>
        <Text style={[styles.stepText, { color: accent }]}>
          {idx + 1} / {slides.length}
        </Text>
      </View>

      {/* Illustration */}
      <Animated.View
        style={[styles.illuArea, { opacity: slideOp, transform: [{ translateX: slideX }] }]}
        key={idx}  // Forces remount on slide change → scene animations restart cleanly
      >
        <Scene />
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.textArea, { opacity: textOp, transform: [{ translateY: textY }] }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </Animated.View>

      {/* Footer: dots + button */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => i < idx || i === idx + 1 ? goTo(i) : null}>
              <View
                style={[
                  styles.dot,
                  i === idx
                    ? [styles.dotActive, { backgroundColor: accent, width: 22 }]
                    : { backgroundColor: accent + '35' },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>{isLast ? 'Get Started' : 'Next  →'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── ILLUSTRATION / MINI-UI STYLES ───────────────────────────────────────────

const il = StyleSheet.create({
  wrap:     { width: W - 48, borderRadius: RADIUS.xl, overflow: 'hidden', alignSelf: 'center' },

  centeredCard: { alignItems: 'center', paddingVertical: 24 },

  brandRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  brandDot:    { width: 12, height: 12, borderRadius: 6 },
  brandName:   { fontSize: 22, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },
  brandTagline:{ fontSize: 12, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', color: COLORS.textSecondary, marginBottom: 16 },

  statChips:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip:       { borderRadius: RADIUS.badge, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  chipText:   { fontSize: 11, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700' },

  critBadge:     { backgroundColor: COLORS.dangerBg, borderRadius: RADIUS.badge, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16, borderWidth: 1, borderColor: COLORS.dangerBorder },
  critBadgeText: { fontSize: 11, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.danger, letterSpacing: 1 },

  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  seat:     { width: 16, height: 16, borderRadius: 3 },
  seatFilled: { backgroundColor: COLORS.warning },
  seatEmpty:  { backgroundColor: COLORS.border },

  avatar:     { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryGlow, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.primary + '55' },
  avatarText: { fontSize: 16, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.primary },

  actionBtn:    { borderRadius: RADIUS.sm, height: 34, justifyContent: 'center', alignItems: 'center' },
  actionBtnText:{ color: '#fff', fontSize: 12, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },

  loggedBadge: { backgroundColor: COLORS.success, borderRadius: RADIUS.badge, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.successBorder },
  loggedText:  { color: '#fff', fontSize: 12, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', letterSpacing: 1.5 },

  routeWrap:   { height: 24, position: 'relative', justifyContent: 'center', marginHorizontal: 8 },
  routeLine:   { height: 3, backgroundColor: COLORS.border, borderRadius: 2, position: 'absolute', left: 0, right: 0 },
  stationDot:  { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.textMuted, top: 7, marginTop: -5 },
  puvDot:      { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary, top: 5, marginTop: -7, justifyContent: 'center', alignItems: 'center' },
  puvRing:     { position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.danger },
});

const mu = StyleSheet.create({
  card:    { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, width: W - 48, ...SHADOW.md },
  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:   { fontSize: 11, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', color: COLORS.textSecondary },
  value:   { fontSize: 13, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },

  pill:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.badge, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  pillDot:  { width: 5, height: 5, borderRadius: 2.5 },
  pillText: { fontSize: 9, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', letterSpacing: 0.4 },

  barBg:   { height: 7, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginVertical: 5 },
  barFill: { height: 7, borderRadius: 4 },

  searchBar:   { flex: 1, height: 32, backgroundColor: COLORS.pageBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', paddingHorizontal: 12 },
  puvCard:     { backgroundColor: COLORS.pageBg, borderRadius: RADIUS.sm, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },

  checkRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS.sm, padding: 9, borderWidth: 1, borderColor: COLORS.border, marginBottom: 6 },
  checkBox:  { width: 14, height: 14, borderRadius: 4, borderWidth: 1.5, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },

  menuRow: { paddingVertical: 7, gap: 8, alignItems: 'center' },
});

// ─── MAIN SCREEN STYLES ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  skipBtn:  { position: 'absolute', top: 52, right: 24, zIndex: 10, paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { fontSize: 13, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', color: COLORS.textMuted },

  stepRow: { paddingTop: 52, paddingHorizontal: 24, marginBottom: 8 },
  stepText:{ fontSize: 11, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', letterSpacing: 0.5 },

  illuArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },

  textArea: { paddingHorizontal: 28, paddingBottom: 8, paddingTop: 20 },
  title:    { fontSize: 22, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8, lineHeight: 29 },
  sub:      { fontSize: 14, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', color: COLORS.textSecondary, lineHeight: 21 },

  footer:  { paddingHorizontal: 28, paddingBottom: 44, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot:     { height: 7, width: 7, borderRadius: 3.5 },
  dotActive: { height: 7, borderRadius: 3.5 },

  nextBtn:  { borderRadius: RADIUS.md, paddingHorizontal: 24, height: 48, justifyContent: 'center', alignItems: 'center', ...SHADOW.button, shadowColor: '#000' },
  nextText: { color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },
});
