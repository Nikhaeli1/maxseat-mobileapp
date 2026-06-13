/**
 * TutorialOverlay — circular coach-mark tutorial system.
 *
 * Creates a dark overlay with a circular "spotlight" hole punched around
 * the target element, plus an arrow tooltip card. Uses pure RN Views
 * (no SVG required): 4 side-rects + 4 corner-rects with borderRadius
 * create a smooth circular cutout.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { COLORS, RADIUS } from '../theme';

const { width: SW, height: SH } = Dimensions.get('window');

const DARK    = 'rgba(8, 12, 28, 0.78)';
const PAD     = 26;   // extra radius beyond element half-size
const HMARGIN = 20;   // tooltip left/right margin from screen edge
const AW      = 11;   // arrow half-width
const AH      = 10;   // arrow height
const TIP_GAP = 18;   // gap between spotlight edge and tooltip

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function TutorialOverlay({
  steps = [],
  visible = false,
  onDone,
  accentColor = COLORS.primary,
}) {
  const [idx,  setIdx]  = useState(0);
  // spot = { cx, cy, r } — circle center + radius in screen coords
  const [spot, setSpot] = useState(null);

  const bgAnim    = useRef(new Animated.Value(0)).current;  // dark overlay opacity
  const tipAnim   = useRef(new Animated.Value(0)).current;  // tooltip opacity
  const tipSlide  = useRef(new Animated.Value(14)).current; // tooltip translateY
  const ringScale = useRef(new Animated.Value(0.6)).current; // spotlight ring scale

  const step   = steps[idx] ?? {};
  const isLast = idx === steps.length - 1;

  // ── Fade overlay in when visible, reset when hidden ────────────────────────
  useEffect(() => {
    if (visible) {
      Animated.timing(bgAnim, {
        toValue: 1, duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      bgAnim.setValue(0);
      setIdx(0);
      setSpot(null);
    }
  }, [visible]);

  // ── Animate tooltip in from current state ──────────────────────────────────
  const animTipIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(tipAnim, {
        toValue: 1, duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(tipSlide, {
        toValue: 0, tension: 65, friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tipAnim, tipSlide]);

  // ── On each step: measure target → animate circle + tooltip in ─────────────
  const showCurrentStep = useCallback(() => {
    // Reset animated values
    tipAnim.setValue(0);
    tipSlide.setValue(14);
    ringScale.setValue(0.6);

    const applySpot = (cx, cy, r) => {
      setSpot({ cx, cy, r });
      // Ring springs in, then tooltip fades in after a short delay
      Animated.parallel([
        Animated.spring(ringScale, {
          toValue: 1, tension: 55, friction: 7,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(130),
          Animated.parallel([
            Animated.timing(tipAnim, {
              toValue: 1, duration: 230,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.spring(tipSlide, {
              toValue: 0, tension: 65, friction: 9,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    };

    if (step.targetRef?.current) {
      step.targetRef.current.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) {
          applySpot(x + w / 2, y + h / 2, Math.max(w, h) / 2 + PAD);
        } else {
          // Could not measure — show without spotlight
          setSpot(null);
          animTipIn();
        }
      });
    } else if (step.targetRect) {
      const { x, y, w, h } = step.targetRect;
      applySpot(x + w / 2, y + h / 2, Math.max(w, h) / 2 + PAD);
    } else {
      setSpot(null);
      animTipIn();
    }
  }, [idx, step, animTipIn]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(showCurrentStep, 160);
    return () => clearTimeout(t);
  }, [idx, visible, showCurrentStep]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    Animated.parallel([
      Animated.timing(tipAnim,   { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(tipSlide,  { toValue: -6, duration: 150, useNativeDriver: true }),
      Animated.timing(ringScale, { toValue: 0.4, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      if (!isLast) setIdx(i => i + 1);
      else { setIdx(0); onDone?.(); }
    });
  };

  const handleSkip = () => {
    Animated.parallel([
      Animated.timing(bgAnim,  { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(tipAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => { setIdx(0); onDone?.(); });
  };

  if (!visible || steps.length === 0) return null;

  // ── Geometry ───────────────────────────────────────────────────────────────
  const cx = spot?.cx ?? SW / 2;
  const cy = spot?.cy ?? SH / 2;
  const r  = spot?.r  ?? 0;

  // Tooltip: below spotlight when spotlight center is in upper 52% of screen
  const putBelow  = !spot || cy < SH * 0.52;
  const tipTop    = putBelow  ? (spot ? cy + r + TIP_GAP : SH / 2 - 90) : undefined;
  const tipBottom = !putBelow ? (spot ? SH - (cy - r) + TIP_GAP : SH / 2 - 90) : undefined;

  // Arrow points toward spotlight center
  const arrowLeft = Math.max(
    AW + 8,
    Math.min(cx - HMARGIN - AW, SW - HMARGIN * 2 - AW * 3),
  );

  // ── Circular cutout geometry (8 dark rects) ────────────────────────────────
  // The 2r×2r square hole is divided into:
  //   4 side rects (top / bottom / left / right of hole)
  //   4 corner quarter-squares that use borderRadius to follow the circle edge
  const t_h = Math.max(0, cy - r);          // top rect height
  const b_t = cy + r;                        // bottom rect top
  const l_w = Math.max(0, cx - r);          // left rect width
  const ri_l = cx + r;                       // right rect left
  const mid_t = cy - r;                      // top of middle band
  const mid_h = r * 2;                       // height of middle band

  return (
    // Root fills entire screen; intercepts all touches (protects underlying UI)
    <View style={[StyleSheet.absoluteFill, styles.root]}>

      {/* ── DARK OVERLAY (circular hole punched via 8 rects) ───────────── */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: bgAnim }]}
        pointerEvents="none"
      >
        {spot ? (
          <>
            {/* TOP — full width above circle */}
            {t_h > 0 && (
              <View style={[styles.dark, { top: 0, left: 0, right: 0, height: t_h }]} />
            )}
            {/* BOTTOM — full width below circle */}
            {b_t < SH && (
              <View style={[styles.dark, { top: b_t, left: 0, right: 0, bottom: 0 }]} />
            )}
            {/* LEFT — beside circle in the middle band */}
            {l_w > 0 && (
              <View style={[styles.dark, { top: mid_t, left: 0, width: l_w, height: mid_h }]} />
            )}
            {/* RIGHT — beside circle in the middle band */}
            {ri_l < SW && (
              <View style={[styles.dark, { top: mid_t, left: ri_l, right: 0, height: mid_h }]} />
            )}
            {/*
             * FOUR CORNER PIECES — each is an r×r square at a corner of the hole.
             * The borderRadius on each one curves TOWARD the circle center,
             * covering the corners of the square that fall outside the circle.
             *
             *   TL: dark in top-left quadrant, transparent near (cx, cy) = borderBottomRightRadius
             *   TR: dark in top-right quadrant,                            = borderBottomLeftRadius
             *   BL: dark in bottom-left quadrant,                          = borderTopRightRadius
             *   BR: dark in bottom-right quadrant,                         = borderTopLeftRadius
             */}
            {/* TOP-LEFT corner */}
            <View style={[styles.dark, {
              position: 'absolute',
              top: mid_t, left: cx - r,
              width: r, height: r,
              borderBottomRightRadius: r,
            }]} />
            {/* TOP-RIGHT corner */}
            <View style={[styles.dark, {
              position: 'absolute',
              top: mid_t, left: cx,
              width: r, height: r,
              borderBottomLeftRadius: r,
            }]} />
            {/* BOTTOM-LEFT corner */}
            <View style={[styles.dark, {
              position: 'absolute',
              top: cy, left: cx - r,
              width: r, height: r,
              borderTopRightRadius: r,
            }]} />
            {/* BOTTOM-RIGHT corner */}
            <View style={[styles.dark, {
              position: 'absolute',
              top: cy, left: cx,
              width: r, height: r,
              borderTopLeftRadius: r,
            }]} />
          </>
        ) : (
          // No spotlight — full dark screen
          <View style={[styles.dark, StyleSheet.absoluteFill]} />
        )}
      </Animated.View>

      {/* ── SPOTLIGHT RING — animated circle border ─────────────────────── */}
      {spot && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: cy - r,
            left: cx - r,
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            borderWidth: 2.5,
            borderColor: accentColor,
            backgroundColor: 'transparent',
            opacity: bgAnim,
            transform: [{ scale: ringScale }],
          }}
        />
      )}

      {/* ── TOOLTIP CARD ────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.tooltipWrap,
          { left: HMARGIN, right: HMARGIN },
          tipTop    != null ? { top: tipTop }       : undefined,
          tipBottom != null ? { bottom: tipBottom } : undefined,
          {
            opacity: tipAnim,
            transform: [{ translateY: tipSlide }],
          },
        ]}
      >
        {/* Arrow pointing UP (tooltip is below spotlight) */}
        {spot && putBelow && (
          <View style={[styles.arrowUp, { left: arrowLeft }]} />
        )}

        <View style={styles.card}>
          {/* Step counter pill */}
          <View style={[styles.stepPill, { backgroundColor: accentColor }]}>
            <Text style={styles.stepNum}>{idx + 1} / {steps.length}</Text>
          </View>

          <Text style={styles.tipTitle}>{step.title}</Text>
          <Text style={styles.tipDesc}>{step.desc}</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              onPress={handleSkip}
              activeOpacity={0.7}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextBtn, { backgroundColor: accentColor }]}
              activeOpacity={0.85}
            >
              <Text style={styles.nextText}>{isLast ? 'Done' : 'Next  →'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Arrow pointing DOWN (tooltip is above spotlight) */}
        {spot && !putBelow && (
          <View style={[styles.arrowDown, { left: arrowLeft }]} />
        )}
      </Animated.View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { zIndex: 9999, elevation: 9999 },

  dark: { position: 'absolute', backgroundColor: DARK },

  tooltipWrap: { position: 'absolute', zIndex: 10000 },

  arrowUp: {
    width: 0, height: 0,
    borderLeftWidth: AW, borderRightWidth: AW, borderBottomWidth: AH,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#ffffff',
    alignSelf: 'flex-start',
  },

  arrowDown: {
    width: 0, height: 0,
    borderLeftWidth: AW, borderRightWidth: AW, borderTopWidth: AH,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
    alignSelf: 'flex-start',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 20,
    elevation: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },

  stepPill: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.badge,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  stepNum: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_ExtraBold',
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  tipTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_ExtraBold',
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 7,
    lineHeight: 22,
  },
  tipDesc: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_Regular',
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },

  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_SemiBold',
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  nextBtn: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  nextText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_ExtraBold',
    fontWeight: '800',
  },
});
