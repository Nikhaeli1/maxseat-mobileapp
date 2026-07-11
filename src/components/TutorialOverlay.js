/**
 * TutorialOverlay — circular coach-mark tutorial system.
 *
 * Punches a circular "spotlight" hole in a dark overlay using 8 Views
 * (no SVG needed): 4 side-rects fill top/bottom/left/right, and 4
 * quarter-square corner-pieces use borderRadius to follow the circle edge.
 *
 * Radius is capped so the spotlight is always a visible circle, even when
 * the target element is wider than the screen.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { COLORS, RADIUS } from '../theme';

const { width: SW, height: SH } = Dimensions.get('window');

const DARK      = 'rgba(8, 12, 28, 0.80)';
const PAD       = 20;   // extra radius beyond element half-height
const MAX_R     = 130;  // cap so wide elements still show a visible circle
const HMARGIN   = 20;   // tooltip horizontal margin
const AW        = 11;   // arrow triangle half-width
const AH        = 10;   // arrow triangle height
const TIP_GAP   = 16;   // gap between circle edge and tooltip

/** Compute spotlight radius for a measured element */
const spotRadius = (w, h) => Math.min(Math.max(w, h) / 2 + PAD, MAX_R);

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function TutorialOverlay({
  steps      = [],
  visible    = false,
  onDone,
  accentColor = COLORS.primary,
}) {
  const [idx,  setIdx]  = useState(0);
  const [spot, setSpot] = useState(null); // { cx, cy, r }

  // Animated values — all use native driver (opacity / transform only)
  const bgFade    = useRef(new Animated.Value(0)).current;  // dark overlay opacity
  const ringScale = useRef(new Animated.Value(0.5)).current;// spotlight ring scale
  const ringFade  = useRef(new Animated.Value(0)).current;  // spotlight ring opacity
  const tipFade   = useRef(new Animated.Value(0)).current;  // tooltip opacity
  const tipY      = useRef(new Animated.Value(16)).current; // tooltip slide-up

  const step   = steps[idx] ?? {};
  const isLast = idx === steps.length - 1;

  // ─── Reset on hide ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      bgFade.setValue(0);
      ringScale.setValue(0.5);
      ringFade.setValue(0);
      tipFade.setValue(0);
      tipY.setValue(16);
      setIdx(0);
      setSpot(null);
    }
  }, [visible]);

  // ─── Animate spotlight + tooltip in ───────────────────────────────────────
  const animateIn = useCallback((cx, cy, r) => {
    ringScale.setValue(0.5);
    ringFade.setValue(0);
    tipFade.setValue(0);
    tipY.setValue(16);

    setSpot({ cx, cy, r });

    Animated.sequence([
      // 1. Dark overlay fades in first
      Animated.timing(bgFade, {
        toValue: 1, duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // 2. Ring springs open
      Animated.parallel([
        Animated.spring(ringScale, {
          toValue: 1, tension: 50, friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(ringFade, {
          toValue: 1, duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // 3. Tooltip slides up shortly after
      Animated.delay(60),
      Animated.parallel([
        Animated.timing(tipFade, {
          toValue: 1, duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(tipY, {
          toValue: 0, tension: 60, friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [bgFade, ringScale, ringFade, tipFade, tipY]);

  // ─── Fallback: no spotlight, just full dark + tooltip ─────────────────────
  const animateInNoSpot = useCallback(() => {
    tipFade.setValue(0);
    tipY.setValue(16);

    Animated.sequence([
      Animated.timing(bgFade, {
        toValue: 1, duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(80),
      Animated.parallel([
        Animated.timing(tipFade, {
          toValue: 1, duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(tipY, {
          toValue: 0, tension: 60, friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [bgFade, tipFade, tipY]);

  // ─── Measure target and show ───────────────────────────────────────────────
  const measureAndShow = useCallback(() => {
    if (step.targetRef?.current) {
      step.targetRef.current.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) {
          animateIn(x + w / 2, y + h / 2, spotRadius(w, h));
        } else {
          // Retry once if layout not settled yet
          setTimeout(() => {
            step.targetRef.current?.measureInWindow((x2, y2, w2, h2) => {
              if (w2 > 0 && h2 > 0) {
                animateIn(x2 + w2 / 2, y2 + h2 / 2, spotRadius(w2, h2));
              } else {
                setSpot(null);
                animateInNoSpot();
              }
            });
          }, 150);
        }
      });
    } else if (step.targetRect) {
      const { x, y, w, h } = step.targetRect;
      animateIn(x + w / 2, y + h / 2, spotRadius(w, h));
    } else {
      setSpot(null);
      animateInNoSpot();
    }
  }, [step, animateIn, animateInNoSpot]);

  useEffect(() => {
    if (!visible) return;
    // Wait one frame + small buffer so all layouts have settled
    const t = setTimeout(measureAndShow, 100);
    return () => clearTimeout(t);
  }, [idx, visible, measureAndShow]);

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handleNext = () => {
    // Animate out current step
    Animated.parallel([
      Animated.timing(tipFade,   { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(tipY,      { toValue: -8, duration: 130, useNativeDriver: true }),
      Animated.timing(ringFade,  { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(ringScale, { toValue: 1.15, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      if (!isLast) setIdx(i => i + 1);
      else { setIdx(0); onDone?.(); }
    });
  };

  const handleSkip = () => {
    Animated.parallel([
      Animated.timing(bgFade,   { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(ringFade, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(tipFade,  { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => { setIdx(0); onDone?.(); });
  };

  if (!visible || steps.length === 0) return null;

  // ─── Geometry ─────────────────────────────────────────────────────────────
  const cx = spot?.cx ?? SW / 2;
  const cy = spot?.cy ?? SH / 2;
  const r  = spot?.r  ?? 0;

  // Tooltip above or below spotlight
  const putBelow  = !spot || cy <= SH * 0.52;
  const tipTop    = putBelow  ? (spot ? cy + r + TIP_GAP : SH / 2 - 100) : undefined;
  const tipBottom = !putBelow ? (spot ? SH - (cy - r) + TIP_GAP : SH / 2 - 100) : undefined;

  // Arrow horizontal: points at cx, clamped to card width
  const arrowLeft = Math.max(
    AW + 8,
    Math.min(cx - HMARGIN - AW, SW - HMARGIN * 2 - AW * 3),
  );

  // ─── 8-rect circular hole geometry ────────────────────────────────────────
  //
  //  Screen:
  //  ┌──────────────────────────────┐
  //  │           TOP rect           │   height = cy - r
  //  ├────────┬────────┬────────────┤
  //  │  LEFT  │  HOLE  │   RIGHT    │   height = r * 2
  //  │  rect  │(circle)│    rect    │
  //  │        ├──┬──┬──┤            │
  //  │        │TL│  │TR│            │
  //  │        ├──┘  └──┤            │
  //  │        │   ○    │            │
  //  │        ├──┐  ┌──┤            │
  //  │        │BL│  │BR│            │
  //  │        └──┴──┴──┘            │
  //  ├──────────────────────────────┤
  //  │         BOTTOM rect          │   height = SH - (cy + r)
  //  └──────────────────────────────┘
  //
  //  The TL/TR/BL/BR corner quarter-squares each carry a matching
  //  borderRadius that curves toward (cx, cy), hiding the corner
  //  outside the circle.

  const t_h  = Math.max(0, cy - r);  // top rect height
  const b_t  = cy + r;               // bottom rect top
  const l_w  = Math.max(0, cx - r);  // left rect width
  const ri_l = cx + r;               // right rect left edge

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>

      {/* ── DARK OVERLAY ──────────────────────────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: bgFade }]}
      >
        {spot ? (
          <>
            {/* Top */}
            {t_h > 0 && (
              <View style={[styles.dk, { top: 0, left: 0, right: 0, height: t_h }]} />
            )}
            {/* Bottom */}
            {b_t < SH && (
              <View style={[styles.dk, { top: b_t, left: 0, right: 0, bottom: 0 }]} />
            )}
            {/* Left */}
            {l_w > 0 && (
              <View style={[styles.dk, { top: cy - r, left: 0, width: l_w, height: r * 2 }]} />
            )}
            {/* Right */}
            {ri_l < SW && (
              <View style={[styles.dk, { top: cy - r, left: ri_l, right: 0, height: r * 2 }]} />
            )}
            {/* Top-left corner — dark in top-left quadrant, curves away toward (cx,cy) */}
            <View style={[styles.dk, {
              top: cy - r, left: cx - r, width: r, height: r,
              borderBottomRightRadius: r,
            }]} />
            {/* Top-right corner */}
            <View style={[styles.dk, {
              top: cy - r, left: cx, width: r, height: r,
              borderBottomLeftRadius: r,
            }]} />
            {/* Bottom-left corner */}
            <View style={[styles.dk, {
              top: cy, left: cx - r, width: r, height: r,
              borderTopRightRadius: r,
            }]} />
            {/* Bottom-right corner */}
            <View style={[styles.dk, {
              top: cy, left: cx, width: r, height: r,
              borderTopLeftRadius: r,
            }]} />
          </>
        ) : (
          <View style={[styles.dk, StyleSheet.absoluteFill]} />
        )}
      </Animated.View>

      {/* ── SPOTLIGHT RING ────────────────────────────────────────────────── */}
      {spot && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top:    cy - r,
            left:   cx - r,
            width:  r * 2,
            height: r * 2,
            borderRadius:  r,
            borderWidth:   2.5,
            borderColor:   accentColor,
            backgroundColor: 'transparent',
            opacity:   ringFade,
            transform: [{ scale: ringScale }],
          }}
        />
      )}

      {/* ── TOOLTIP ───────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.tipWrap,
          { left: HMARGIN, right: HMARGIN },
          tipTop    != null ? { top: tipTop }       : undefined,
          tipBottom != null ? { bottom: tipBottom } : undefined,
          { opacity: tipFade, transform: [{ translateY: tipY }] },
        ]}
      >
        {/* Arrow ▲ when tooltip is below the spotlight */}
        {spot && putBelow && (
          <View style={[styles.arrowUp, { left: arrowLeft }]} />
        )}

        <View style={styles.card}>
          <View style={[styles.pill, { backgroundColor: accentColor }]}>
            <Text style={styles.pillTxt}>{idx + 1} / {steps.length}</Text>
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.desc}>{step.desc}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={handleSkip}
              activeOpacity={0.7}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextBtn, { backgroundColor: accentColor }]}
              activeOpacity={0.85}
            >
              <Text style={styles.nextTxt}>{isLast ? 'Done' : 'Next  →'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Arrow ▼ when tooltip is above the spotlight */}
        {spot && !putBelow && (
          <View style={[styles.arrowDown, { left: arrowLeft }]} />
        )}
      </Animated.View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { zIndex: 9999, elevation: 9999 },
  dk:     { position: 'absolute', backgroundColor: DARK },
  tipWrap:{ position: 'absolute', zIndex: 10000 },

  arrowUp: {
    width: 0, height: 0,
    borderLeftWidth: AW,  borderRightWidth: AW,  borderBottomWidth: AH,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#fff',
    alignSelf: 'flex-start',
  },
  arrowDown: {
    width: 0, height: 0,
    borderLeftWidth: AW,  borderRightWidth: AW,  borderTopWidth: AH,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#fff',
    alignSelf: 'flex-start',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: 20,
    elevation: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },

  pill:    { alignSelf: 'flex-start', borderRadius: RADIUS.badge, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  pillTxt: { color: '#fff', fontSize: 10, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', letterSpacing: 0.6 },

  title: { fontSize: 17, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 7, lineHeight: 22 },
  desc:  { fontSize: 13, fontFamily: 'PlusJakartaSans_Regular',   fontWeight: '500', color: COLORS.textSecondary, lineHeight: 20, marginBottom: 18 },

  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skip:    { fontSize: 13, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', color: COLORS.textMuted },
  nextBtn: { borderRadius: RADIUS.sm, paddingHorizontal: 22, paddingVertical: 10 },
  nextTxt: { color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },
});
