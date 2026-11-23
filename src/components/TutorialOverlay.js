/**
 * TutorialOverlay — the coach-mark tour shown after the first-time overview.
 *
 * DESIGN RULE: NOTHING THE USER NEEDS DEPENDS ON AN ANIMATION FINISHING.
 *   The old tour faded its card in at the END of a chain of animations. On the
 *   new Android architecture that chain could stall, leaving the screen dimmed
 *   with no card and no way out. Now:
 *     - the card is always fully opaque the moment it renders (only a small
 *       slide/pop plays on top, and if that stalls the card is still there);
 *     - the dim fades in, but if that stalls the screen just stays undimmed;
 *     - if the target can't be measured, the card shows centered anyway;
 *     - there is always a close (×) button and a Skip.
 *
 * HOW THE SPOTLIGHT IS DRAWN
 *   Four plain dim rectangles around the target. Android can't draw one giant
 *   view with a screen-sized border, so we don't try.
 *
 * Everything is JS-driven (useNativeDriver: false). Native-driven values can be
 * reset by a re-render on the new architecture, which is what hid the card.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, Platform,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { COLORS, RADIUS, FONTS, IS_DARK, themed } from '../theme';
import Icon from './Icon';

const WIN = Dimensions.get('window');

const DIM         = 'rgba(12, 18, 15, 0.70)';
const LIME        = '#C6F24E';
const PAD         = 8;     // breathing room around the measured element
const SPOT_R      = 18;
const CARD_INSET  = 16;
const BOTTOM_SAFE = 30;
const GAP         = 14;
const MAX_SPOT_FRAC = 0.45;
const EST_CARD_H  = 200;

const SPRING = { tension: 70, friction: 12, useNativeDriver: false };

export default function TutorialOverlay({
  steps       = [],
  visible     = false,
  onDone,
  accentColor = COLORS.primary,
}) {
  const [idx,   setIdx]   = useState(0);
  const [spot,  setSpot]  = useState(null);     // { x, y, w, h } or null
  const [ready, setReady] = useState(false);    // first measurement done (or gave up)
  const [size,  setSize]  = useState({ w: WIN.width, h: WIN.height });
  const [cardH, setCardH] = useState(EST_CARD_H);

  const aX = useRef(new Animated.Value(0)).current;
  const aY = useRef(new Animated.Value(0)).current;
  const aW = useRef(new Animated.Value(0)).current;
  const aH = useRef(new Animated.Value(0)).current;

  const dimFade = useRef(new Animated.Value(0)).current;
  const pop     = useRef(new Animated.Value(1)).current;   // card scale, cosmetic only
  const slide   = useRef(new Animated.Value(0)).current;   // card offset, cosmetic only
  const halo    = useRef(new Animated.Value(0)).current;

  const rootRef = useRef(null);
  const sizeRef = useRef({ w: WIN.width, h: WIN.height });
  const hasSpot = useRef(false);
  const doneRef = useRef(false);

  const step   = steps[idx] ?? {};
  const isLast = idx === steps.length - 1;

  // ── Soft breathing halo (cosmetic) ──────────────────────────────────────
  useEffect(() => {
    if (!visible) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(halo, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(halo, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [visible, halo]);

  // ── Reset whenever the tour closes ──────────────────────────────────────
  useEffect(() => {
    if (visible) { doneRef.current = false; return; }
    setIdx(0); setSpot(null); setReady(false);
    hasSpot.current = false;
    dimFade.setValue(0);
  }, [visible, dimFade]);

  // ── Measure the current target ──────────────────────────────────────────
  const measure = useCallback((target, cb) => {
    const { w: RW, h: RH } = sizeRef.current;
    const norm = (mx, my, mw, mh) => {
      const x = Math.max(0, mx - PAD);
      const y = Math.max(0, my - PAD);
      const w = Math.min(RW, mx + mw + PAD) - x;
      const h = Math.min(Math.min(RH, my + mh + PAD) - y, RH * MAX_SPOT_FRAC);
      return w > 4 && h > 4 ? { x, y, w, h } : null;
    };
    const rootOffset = (fn) => {
      const root = rootRef.current;
      if (!root?.measureInWindow) { fn(0, 0); return; }
      root.measureInWindow((ox, oy) => fn(Number.isFinite(ox) ? ox : 0, Number.isFinite(oy) ? oy : 0));
    };
    if (target.targetRef) {
      const tryOnce = (retry) => {
        const node = target.targetRef.current;
        if (!node?.measureInWindow) { if (retry) setTimeout(() => tryOnce(false), 250); else cb(null); return; }
        node.measureInWindow((x, y, w, h) => {
          if (w > 0 && h > 0) rootOffset((ox, oy) => cb(norm(x - ox, y - oy, w, h)));
          else if (retry) setTimeout(() => tryOnce(false), 250);
          else cb(null);
        });
      };
      tryOnce(true);
    } else if (target.targetRect) {
      const { x = 0, y = 0, w, h, fromBottom } = target.targetRect;
      cb(norm(x, fromBottom ? RH - h : y, w ?? RW, h));
    } else cb(null);
  }, []);

  // ── Go to a step: measure, move the spotlight, nudge the card ───────────
  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    // Never wait more than 900 ms for a measurement: show the card regardless.
    const giveUp = setTimeout(() => { if (!cancelled) setReady(true); }, 900);
    const t = setTimeout(() => {
      measure(step, (rect) => {
        if (cancelled) return;
        clearTimeout(giveUp);
        if (rect) {
          if (!hasSpot.current) {
            aX.setValue(rect.x); aY.setValue(rect.y); aW.setValue(rect.w); aH.setValue(rect.h);
          } else {
            Animated.parallel([
              Animated.spring(aX, { toValue: rect.x, ...SPRING }),
              Animated.spring(aY, { toValue: rect.y, ...SPRING }),
              Animated.spring(aW, { toValue: rect.w, ...SPRING }),
              Animated.spring(aH, { toValue: rect.h, ...SPRING }),
            ]).start();
          }
          hasSpot.current = true;
        }
        setSpot(rect);
        setReady(true);
        // cosmetic entrance: small slide + pop. The card is already opaque.
        slide.setValue(10); pop.setValue(0.97);
        Animated.parallel([
          Animated.spring(slide, { toValue: 0, tension: 80, friction: 10, useNativeDriver: false }),
          Animated.spring(pop,   { toValue: 1, tension: 90, friction: 8,  useNativeDriver: false }),
        ]).start();
        Animated.timing(dimFade, { toValue: 1, duration: 260, useNativeDriver: false }).start();
      });
    }, 80);
    return () => { cancelled = true; clearTimeout(t); clearTimeout(giveUp); };
  }, [idx, visible, step, measure, aX, aY, aW, aH, dimFade, slide, pop]);

  // ── Close: hide immediately from React's point of view ──────────────────
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone?.();
  }, [onDone]);

  const next = () => (isLast ? finish() : setIdx(i => i + 1));
  const back = () => idx > 0 && setIdx(i => i - 1);

  if (!visible || steps.length === 0) return null;

  // ── Card placement ──────────────────────────────────────────────────────
  const { w: RW, h: RH } = size;
  const minTop = Platform.OS === 'ios' ? 54 : CARD_INSET + 8;
  const maxTop = Math.max(minTop, RH - cardH - BOTTOM_SAFE);
  let cardTop = (RH - cardH) / 2;
  if (spot) {
    const below = spot.y + spot.h + GAP;
    const above = spot.y - GAP - cardH;
    if (below <= maxTop) cardTop = below;
    else if (above >= minTop) cardTop = above;
  }
  cardTop = Math.min(Math.max(cardTop, minTop), maxTop);

  const haloOp = halo.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const cardBg = IS_DARK ? '#262B28' : '#FFFFFF';
  const ink    = IS_DARK ? '#FFFFFF' : '#14211B';
  const muted  = IS_DARK ? '#9BA8A1' : '#5E6F67';
  const track  = IS_DARK ? '#343A36' : '#DCE8E1';
  const progress = (idx + 1) / steps.length;

  return (
    <View
      ref={rootRef}
      style={styles.root}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) { sizeRef.current = { w: width, h: height }; setSize({ w: width, h: height }); }
      }}
    >
      {/* DIM with a spotlight hole (four rectangles). Blocks taps on the app. */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: dimFade }]}>
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

      {/* Lime ring around the highlighted element */}
      {spot && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', top: aY, left: aX, width: aW, height: aH,
            borderRadius: SPOT_R, borderWidth: 3, borderColor: LIME, opacity: haloOp,
          }}
        />
      )}

      {/* CARD — always opaque once ready */}
      {ready && (
        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - cardH) > 1) setCardH(h);
          }}
          style={[styles.cardWrap, {
            left: CARD_INSET, right: CARD_INSET, top: cardTop,
            transform: [{ translateY: slide }, { scale: pop }],
          }]}
        >
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.topRow}>
              <Text style={[styles.counter, { color: muted }]}>{idx + 1} of {steps.length}</Text>
              <TouchableOpacity onPress={finish} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Close tour">
                <Icon name="close" size={20} color={muted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.track, { backgroundColor: track }]}>
              <View style={[styles.fill, { width: `${progress * 100}%` }]} />
            </View>

            <View style={styles.body}>
              {step.icon ? (
                <View style={[styles.iconTile, { backgroundColor: IS_DARK ? 'rgba(198,242,78,0.14)' : '#EEF5F1' }]}>
                  <Icon name={step.icon} size={22} color={IS_DARK ? '#C6F24E' : (accentColor || '#2F6F5A')} />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: ink }]}>{step.title}</Text>
                <Text style={[styles.desc, { color: muted }]}>{step.desc}</Text>
              </View>
            </View>

            <View style={styles.footer}>
              {idx > 0 ? (
                <TouchableOpacity onPress={back} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Text style={[styles.link, { color: muted }]}>Back</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={finish} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Text style={[styles.link, { color: muted }]}>Skip tour</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={next} activeOpacity={0.85} style={[styles.nextBtn, { backgroundColor: accentColor }]}>
                <Text style={styles.nextTxt}>{isLast ? "Let's go" : 'Next'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = themed(() => ({
  root:     { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 9999 },
  dim:      { position: 'absolute', backgroundColor: DIM },
  cardWrap: { position: 'absolute', zIndex: 30, elevation: 30 },
  card: {
    borderRadius: 22, padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24 },
      android: { elevation: 18 },
    }),
  },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  counter:  { fontSize: 11.5, fontFamily: FONTS.semiBold, letterSpacing: 0.4 },
  close:    { fontSize: 15, fontFamily: FONTS.semiBold },
  track:    { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 14 },
  fill:     { height: 4, borderRadius: 2, backgroundColor: LIME },
  body:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  iconTile: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconTxt:  { fontSize: 22 },
  title:    { fontSize: 16, fontFamily: FONTS.extraBold, marginBottom: 4, lineHeight: 21 },
  desc:     { fontSize: 13, fontFamily: FONTS.regular, lineHeight: 19 },
  footer:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link:     { fontSize: 13, fontFamily: FONTS.semiBold },
  nextBtn:  { borderRadius: RADIUS.full, paddingHorizontal: 24, paddingVertical: 11 },
  nextTxt:  { color: '#FFFFFF', fontSize: 13.5, fontFamily: FONTS.extraBold },
}));
