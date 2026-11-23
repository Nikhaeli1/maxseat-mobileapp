import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../theme';

/**
 * Grey placeholder cards shown while the first data loads, so the screen
 * keeps its shape instead of flashing a spinner. JS-driven and never fully
 * transparent (see the note in OnboardingScreen about native opacity).
 */
function useGlow() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.timing(v, { toValue: 0, duration: 700, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
}

function Bar({ w, h = 12, mt = 0, glow }) {
  return <Animated.View style={[styles.bar, { width: w, height: h, marginTop: mt, opacity: glow }]} />;
}

export function SkeletonCard({ variant = 'puv' }) {
  const glow = useGlow();
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View>
          <Bar w={110} h={20} glow={glow} />
          <Bar w={150} h={11} mt={8} glow={glow} />
        </View>
        <Bar w={76} h={22} glow={glow} />
      </View>
      {variant === 'puv' && <Bar w="100%" h={8} mt={16} glow={glow} />}
      <View style={[styles.rowBetween, { marginTop: 12 }]}>
        <Bar w={140} h={11} glow={glow} />
        <Bar w={36} h={11} glow={glow} />
      </View>
      <View style={[styles.row, { marginTop: 12 }]}>
        <Bar w={84} h={22} glow={glow} />
        <Bar w={110} h={22} glow={glow} />
      </View>
    </View>
  );
}

export default function SkeletonList({ count = 3, variant }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} variant={variant} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  list:       { padding: 16, paddingTop: 4 },
  card:       { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  bar:        { backgroundColor: COLORS.border, borderRadius: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  row:        { flexDirection: 'row', gap: 8 },
});
