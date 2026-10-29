/**
 * TutorialOverlay — a polished, morphing coach-mark tour.
 *
 * WHY A MODAL
 *   The tab bar is rendered by the navigator as a sibling of the screen, so an
 *   overlay mounted inside a screen can never cover it — which is why bottom-nav
 *   highlights used to sit above the real tab bar. Rendering into a Modal gives
 *   us the entire window, so measureInWindow coordinates line up exactly.
 *
 * HOW THE SPOTLIGHT IS DRAWN
 *   Four plain dim rectangles around the target (above, below, left, right);
 *   the gap between them is the hole. This used to be one giant view with a
 *   screen-sized rounded border, but Android can't draw a shape that big: the
 *   hole disappeared and the card could end up hidden, leaving the app dim.
 *
 * MOTION
 *   Between steps the spotlight MORPHS: x/y/w/h spring to the next element so
 *   the hole glides and resizes across the screen. The card cross-fades around
 *   the morph, and a soft halo breathes while the user reads.
 *
 *   Everything is JS-driven. The card used to use the native driver, but on the
 *   new Android architecture a re-render (e.g. the card measuring itself) could
 *   reset a native-driven opacity back to 0: the card vanished while the dim
 *   stayed, so the tour could never be closed and the whole app stayed dark.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, Platform,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { COLORS, RADIUS } from '../theme';

const WIN = Dimensions.get('window');

// ─── TUNING ───────────────────────────────────────────────────────────────────

const DIM        = 'rgba(10, 14, 30, 0.66)';
const PAD        = 8;    // breathing room around the measured element
const SPOT_R     = 18;   // spotlight corner radius
const CARD_INSET = 16;   // card margin from screen edges
const BOTTOM_SAFE = 30;  // keeps the card clear of the home indicator
const GAP        = 14;   // gap between spotlight and card
// A spotlight taller than this leaves no room for the card, so large
// containers (whole lists, page wrappers) highlight their top region instead.
const MAX_SPOT_FRAC = 0.5;
const AW         = 9;    // arrow half-width
const AH         = 8;    // arrow height
const EST_CARD_H = 190;  // used before the card has measured itself

const SPRING = { tension: 62, friction: 11, useNativeDriver: false };
const POP    = { tension: 70, friction: 6.5, useNativeDriver: false };

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function TutorialOverlay({
  steps       = [],
  visible     = false,
  onDone,
  accentColor = COLORS.primary,
  theme       = 'light',
}) {
  const [idx,   setIdx]   = useState(0);
  const [spot,  setSpot]  = useState(null);           // { x, y, w, h }
  const [size,  setSize]  = useState({ w: WIN.width, h: WIN.height });
  const [cardH, setCardH] = useState(EST_CARD_H);

  const dark = theme === 'dark';

  // Spotlight geometry — JS-driven so it can morph
  const aX = useRef(new Animated.Value(WIN.width / 2)).current;
  const aY = useRef(new Animated.Value(WIN.height / 2)).current;
  const aW = useRef(new Animated.Value(0)).current;
  const aH = useRef(new Animated.Value(0)).current;

  const dimFade  = useRef(new Animated.Value(0)).current;
  const rimFade  = useRef(new Animated.Value(0)).current;
  const rimPop   = useRef(new Animated.Value(1)).current;
  const halo     = useRef(new Animated.Value(0)).current;

  // Card — JS driver (see MOTION note above)
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardY    = useRef(new Animated.Value(14)).current;

  const haloLoop  = useRef(null);
  const firstShow = useRef(true);
  const rootRef   = useRef(null);
  const sizeRef   = useRef({ w: WIN.width, h: WIN.height });

  const step   = steps[idx] ?? {};
  const isLast = idx === steps.length - 1;

  // ── Breathing halo ───────────────────────────────────────────────────────
  const startHalo = useCallback(() => {
    haloLoop.current?.stop();
    halo.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1, duration: 1500,
          easing: Easing.inOut(Easing.ease), useNativeDriver: false,
        }),
        Animated.timing(halo, {
          toValue: 0, duration: 1500,
          easing: Easing.inOut(Easing.ease), useNativeDriver: false,
        }),
      ])
    );
    haloLoop.current = loop;
    loop.start();
  }, [halo]);

  const stopHalo = useCallback(() => {
    haloLoop.current?.stop();
    haloLoop.current = null;
    halo.setValue(0);
  }, [halo]);

  // ── Reset when hidden ────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      stopHalo();
      dimFade.setValue(0);
      rimFade.setValue(0);
      rimPop.setValue(1);
      cardFade.setValue(0);
      cardY.setValue(14);
      firstShow.current = true;
      setIdx(0);
      setSpot(null);
    }
  }, [visible]);

  // ── Card in / out ────────────────────────────────────────────────────────
  const cardIn = useCallback(() => {
    cardY.setValue(14);
    Animated.parallel([
      Animated.timing(cardFade, {
        toValue: 1, duration: 260,
        easing: Easing.out(Easing.ease), useNativeDriver: false,
      }),
      Animated.spring(cardY, {
        toValue: 0, tension: 58, friction: 9, useNativeDriver: false,
      }),
    ]).start();
  }, [cardFade, cardY]);

  const cardOut = useCallback((cb) => {
    Animated.parallel([
      Animated.timing(cardFade, { toValue: 0, duration: 150, useNativeDriver: false }),
      Animated.timing(cardY,    { toValue: -8, duration: 150, useNativeDriver: false }),
    ]).start(() => cb?.());
  }, [cardFade, cardY]);

  // ── First appearance ─────────────────────────────────────────────────────
  const showFirst = useCallback((rect) => {
    setSpot(rect);
    if (rect) {
      aX.setValue(rect.x); aY.setValue(rect.y);
      aW.setValue(rect.w); aH.setValue(rect.h);
      rimPop.setValue(0.94);
    }
    Animated.sequence([
      Animated.timing(dimFade, {
        toValue: 1, duration: 280,
        easing: Easing.out(Easing.ease), useNativeDriver: false,
      }),
      Animated.parallel([
        Animated.timing(rimFade, {
          toValue: 1, duration: 240,
          easing: Easing.out(Easing.ease), useNativeDriver: false,
        }),
        Animated.spring(rimPop, { toValue: 1, ...POP }),
      ]),
    ]).start(() => { cardIn(); if (rect) startHalo(); });
  }, [aX, aY, aW, aH, dimFade, rimFade, rimPop, cardIn, startHalo]);

  // ── Step change: card out → spotlight morphs → card in ───────────────────
  const morphTo = useCallback((rect) => {
    stopHalo();
    cardOut(() => {
      setSpot(rect);
      if (!rect) {
        Animated.timing(rimFade, { toValue: 0, duration: 180, useNativeDriver: false })
          .start(cardIn);
        return;
      }
      rimPop.setValue(0.97);
      Animated.parallel([
        Animated.timing(rimFade, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.spring(aX,     { toValue: rect.x, ...SPRING }),
        Animated.spring(aY,     { toValue: rect.y, ...SPRING }),
        Animated.spring(aW,     { toValue: rect.w, ...SPRING }),
        Animated.spring(aH,     { toValue: rect.h, ...SPRING }),
        Animated.spring(rimPop, { toValue: 1, ...POP }),
      ]).start(startHalo);
      setTimeout(cardIn, 200);
    });
  }, [aX, aY, aW, aH, rimFade, rimPop, cardIn, cardOut, startHalo, stopHalo]);

  // ── Measure the current target ───────────────────────────────────────────
  const measureStep = useCallback((cb) => {
    const { w: RW, h: RH } = sizeRef.current;

    const norm = (mx, my, mw, mh) => {
      const x = Math.max(0, mx - PAD);
      const y = Math.max(0, my - PAD);
      const w = Math.min(RW, mx + mw + PAD) - x;
      let   h = Math.min(RH, my + mh + PAD) - y;
      // Cap tall targets so the card always has somewhere to sit
      h = Math.min(h, RH * MAX_SPOT_FRAC);
      return { x, y, w, h };
    };

    // Inside a Modal the root already spans the window, so this offset is
    // normally zero — but measuring keeps us correct on every platform.
    const withOffset = (fn) => {
      const root = rootRef.current;
      if (!root) { fn(0, 0); return; }
      root.measureInWindow((ox, oy) =>
        fn(Number.isFinite(ox) ? ox : 0, Number.isFinite(oy) ? oy : 0));
    };

    const attempt = (retry) => {
      const node = step.targetRef?.current;
      if (!node) {
        if (retry) setTimeout(() => attempt(false), 200);
        else cb(null);
        return;
      }
      node.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) withOffset((ox, oy) => cb(norm(x - ox, y - oy, w, h)));
        else if (retry) setTimeout(() => attempt(false), 200);
        else cb(null);
      });
    };

    if (step.targetRef) attempt(true);
    else if (step.targetRect) {
      // `fromBottom` anchors to the real window bottom — correct for tab bars.
      const { x = 0, y = 0, w, h, fromBottom } = step.targetRect;
      cb(norm(x, fromBottom ? RH - h : y, w ?? RW, h));
    } else cb(null);
  }, [step]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      measureStep((rect) => {
        if (firstShow.current) { firstShow.current = false; showFirst(rect); }
        else morphTo(rect);
      });
    }, 120);
    return () => clearTimeout(t);
  }, [idx, visible, measureStep, showFirst, morphTo]);

  // ── Navigation ────────────────────────────────────────────────────────────
  // Always closes the tour, even if an animation callback never arrives
  const finishing = useRef(false);
  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    stopHalo();
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      finishing.current = false;
      firstShow.current = true;
      setIdx(0);
      onDone?.();
    };
    Animated.parallel([
      Animated.timing(dimFade,  { toValue: 0, duration: 260, useNativeDriver: false }),
      Animated.timing(rimFade,  { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(cardFade, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start(close);
    setTimeout(close, 600);   // safety net
  }, [dimFade, rimFade, cardFade, onDone, stopHalo]);

  // Safety net: if the card somehow isn't showing a few seconds after the dim
  // appeared, close the tour rather than leave the app darkened.
  useEffect(() => {
    if (!visible) return undefined;
    const t = setTimeout(() => {
      if (cardFade.__getValue() < 0.5) finish();
    }, 4000);
    return () => clearTimeout(t);
  }, [visible, idx, cardFade, finish]);

  const handleNext = () => (isLast ? finish() : setIdx(i => i + 1));
  const handleBack = () => idx > 0 && setIdx(i => i - 1);

  if (!visible || steps.length === 0) return null;

  // ── Card placement ────────────────────────────────────────────────────────
  const { w: RW, h: RH } = size;
  const sx = spot?.x ?? 0, sy = spot?.y ?? 0;
  const sw = spot?.w ?? 0, sh = spot?.h ?? 0;

  // Hard bounds the card can never leave, whatever the spotlight does.
  const minTop = CARD_INSET;
  const maxTop = Math.max(CARD_INSET, RH - cardH - BOTTOM_SAFE);

  let cardTop;
  let arrowDir = null;   // 'up' = card below spotlight, 'down' = card above

  if (!spot) {
    cardTop = (RH - cardH) / 2;
  } else {
    const below = sy + sh + GAP;
    const above = sy - GAP - cardH;
    if (below <= maxTop)       { cardTop = below; arrowDir = 'up';   }
    else if (above >= minTop)  { cardTop = above; arrowDir = 'down'; }
    else                       { cardTop = (RH - cardH) / 2; }
  }

  // Final clamp — guarantees the card stays fully on screen even if cardH
  // changes after this frame (it is measured via onLayout).
  const clampedTop = Math.min(Math.max(cardTop, minTop), maxTop);
  if (clampedTop !== cardTop) arrowDir = null;  // no longer adjacent, drop the arrow
  cardTop = clampedTop;

  const arrowLeft = Math.max(
    14,
    Math.min(sx + sw / 2 - CARD_INSET - AW, RW - CARD_INSET * 2 - AW * 2 - 14)
  );

  // ── Palette ───────────────────────────────────────────────────────────────
  const cardBg  = dark ? '#101A34' : '#FFFFFF';
  const titleC  = dark ? '#FFFFFF' : COLORS.textPrimary;
  const descC   = dark ? 'rgba(255,255,255,0.70)' : COLORS.textSecondary;
  const mutedC  = dark ? 'rgba(255,255,255,0.50)' : COLORS.textMuted;
  const lineC   = dark ? 'rgba(255,255,255,0.10)' : 'rgba(10,14,30,0.07)';
  const dotIdle = dark ? 'rgba(255,255,255,0.22)' : 'rgba(10,14,30,0.14)';

  // Halo breathes between two subtle states
  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const haloOp    = halo.interpolate({ inputRange: [0, 1], outputRange: [0.30, 0.62] });

  return (
    <View
      ref={rootRef}
      style={styles.root}
      pointerEvents="box-none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) {
          sizeRef.current = { w: width, h: height };
          setSize({ w: width, h: height });
        }
      }}
    >
        {/* ── DIM + SPOTLIGHT HOLE (four rectangles around the target) ──── */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: dimFade }]}
        >
          {spot ? (
            <>
              <Animated.View style={[styles.dim, { top: 0, left: 0, right: 0, height: aY }]} />
              <Animated.View style={[styles.dim, { top: Animated.add(aY, aH), left: 0, right: 0, bottom: 0 }]} />
              <Animated.View style={[styles.dim, { top: aY, height: aH, left: 0, width: aX }]} />
              <Animated.View style={[styles.dim, { top: aY, height: aH, left: Animated.add(aX, aW), right: 0 }]} />
            </>
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: DIM }]} />
          )}
        </Animated.View>

        {/* ── HALO — soft accent glow, breathing ─────────────────────────── */}
        {spot && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: aY, left: aX, width: aW, height: aH,
              borderRadius: SPOT_R + 5,
              borderWidth: 9,
              borderColor: accentColor,
              backgroundColor: 'transparent',
              opacity: Animated.multiply(haloOp, rimFade),
              transform: [{ scale: Animated.multiply(haloScale, rimPop) }],
            }}
          />
        )}

        {/* ── CONTACT SHADOW — dark falloff hugging the raised panel ─────── */}
        {spot && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: aY, left: aX, width: aW, height: aH,
              borderRadius: SPOT_R,
              borderWidth: 5,
              borderColor: 'rgba(8,12,28,0.22)',
              backgroundColor: 'transparent',
              opacity: rimFade,
              transform: [{ scale: rimPop }],
            }}
          />
        )}

        {/* ── LIT RIM — bright edge, light catching a raised card ────────── */}
        {spot && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: aY, left: aX, width: aW, height: aH,
              borderRadius: SPOT_R,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.95)',
              backgroundColor: 'transparent',
              opacity: rimFade,
              transform: [{ scale: rimPop }],
            }}
          />
        )}

        {/* ── CARD ───────────────────────────────────────────────────────── */}
        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - cardH) > 1) setCardH(h);
          }}
          style={[
            styles.cardWrap,
            { left: CARD_INSET, right: CARD_INSET, top: cardTop },
            { opacity: cardFade, transform: [{ translateY: cardY }] },
          ]}
        >
          {arrowDir === 'up' && (
            <View style={[styles.arrowUp, { left: arrowLeft, borderBottomColor: cardBg }]} />
          )}

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.body}>
              {step.icon ? (
                <View style={[styles.iconTile, {
                  backgroundColor: accentColor + (dark ? '2E' : '16'),
                }]}>
                  <Text style={styles.iconTxt}>{step.icon}</Text>
                </View>
              ) : null}

              <View style={styles.bodyTxt}>
                <Text style={[styles.title, { color: titleC }]}>{step.title}</Text>
                <Text style={[styles.desc,  { color: descC  }]}>{step.desc}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: lineC }]} />

            <View style={styles.footer}>
              {/* Progress dots — active dot stretches into a pill */}
              <View style={styles.dots}>
                {steps.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === idx
                        ? { width: 18, backgroundColor: accentColor }
                        : { width: 6,  backgroundColor: dotIdle },
                    ]}
                  />
                ))}
              </View>

              <View style={styles.actions}>
                {idx > 0 && (
                  <TouchableOpacity
                    onPress={handleBack}
                    activeOpacity={0.6}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.backBtn}
                  >
                    <Text style={[styles.backTxt, { color: mutedC }]}>Back</Text>
                  </TouchableOpacity>
                )}

                {!isLast && (
                  <TouchableOpacity
                    onPress={finish}
                    activeOpacity={0.6}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.backBtn}
                  >
                    <Text style={[styles.backTxt, { color: mutedC }]}>Skip</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleNext}
                  activeOpacity={0.85}
                  style={[styles.nextBtn, { backgroundColor: accentColor }]}
                >
                  <Text style={styles.nextTxt}>{isLast ? 'Got it' : 'Next'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {arrowDir === 'down' && (
            <View style={[styles.arrowDown, { left: arrowLeft, borderTopColor: cardBg }]} />
          )}
        </Animated.View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:     { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 9999 },
  dim:      { position: 'absolute', backgroundColor: DIM },
  // elevation on Android decides what draws on top, so the card gets the highest
  cardWrap: { position: 'absolute', zIndex: 20, elevation: 24 },

  arrowUp: {
    width: 0, height: 0,
    borderLeftWidth: AW, borderRightWidth: AW, borderBottomWidth: AH,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    alignSelf: 'flex-start',
  },
  arrowDown: {
    width: 0, height: 0,
    borderLeftWidth: AW, borderRightWidth: AW, borderTopWidth: AH,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    alignSelf: 'flex-start',
  },

  card: {
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 26,
      },
      android: { elevation: 16 },
    }),
  },

  body:     { flexDirection: 'row', alignItems: 'flex-start', padding: 17 },
  iconTile: {
    width: 50, height: 50, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 13,
  },
  iconTxt: { fontSize: 24 },
  bodyTxt: { flex: 1, paddingTop: 1 },

  title: {
    fontSize: 15.5,
    fontFamily: 'PlusJakartaSans_ExtraBold',
    fontWeight: '800',
    marginBottom: 5,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_Regular',
    fontWeight: '500',
    lineHeight: 18.5,
  },

  divider: { height: 1, marginHorizontal: 17 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 17,
    paddingVertical: 12,
  },

  dots: { flexDirection: 'row', alignItems: 'center' },
  dot:  { height: 6, borderRadius: 3, marginRight: 5 },

  actions: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { paddingHorizontal: 10 },
  backTxt: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_SemiBold',
    fontWeight: '600',
  },

  nextBtn: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 22,
    paddingVertical: 9,
    marginLeft: 6,
  },
  nextTxt: {
    color: '#fff',
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_ExtraBold',
    fontWeight: '800',
  },
});
