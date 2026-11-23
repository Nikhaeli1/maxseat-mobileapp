import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT } from '../theme';

/**
 * Gradient fill.
 *   <Gradient name="brand" style={...}>...</Gradient>       forest green
 *   <Gradient name="lime" />, name="page", name="mint", or colors={['#a', '#b']}
 * Default direction: top-left to bottom-right.
 */
export default function Gradient({ name = 'brand', colors, start = { x: 0, y: 0 }, end = { x: 1, y: 1 }, style, children, ...rest }) {
  return (
    <LinearGradient colors={colors || GRADIENT[name] || GRADIENT.brand} start={start} end={end} style={style} {...rest}>
      {children}
    </LinearGradient>
  );
}

/** Fills its parent from behind (parent needs overflow: 'hidden' for rounded corners). */
export function GradientFill({ name = 'brand', colors, start, end, glow = false }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Gradient name={name} colors={colors} start={start} end={end} style={StyleSheet.absoluteFill} />
      {glow === 'light' ? (
        <>
          {/* Soft color spots for light pages */}
          <View style={[blob.base, blob.limeLight]} />
          <View style={[blob.base, blob.greenLight]} />
        </>
      ) : glow ? (
        <>
          {/* Soft lime and mint light spots, for a modern look */}
          <View style={[blob.base, blob.lime]} />
          <View style={[blob.base, blob.mint]} />
        </>
      ) : null}
    </View>
  );
}

const blob = StyleSheet.create({
  base: { position: 'absolute', borderRadius: 999 },
  lime: { width: 220, height: 220, top: -90, right: -70, backgroundColor: 'rgba(198,242,78,0.20)' },
  mint: { width: 180, height: 180, bottom: -110, left: -50, backgroundColor: 'rgba(255,255,255,0.08)' },
  limeLight:  { width: 320, height: 320, top: -140, right: -120, backgroundColor: 'rgba(198,242,78,0.28)' },
  greenLight: { width: 300, height: 300, bottom: -150, left: -130, backgroundColor: 'rgba(47,111,90,0.12)' },
});
