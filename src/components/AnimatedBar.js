import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

/**
 * A fill bar that glides to its new value when live data changes,
 * instead of jumping. pct is 0..100.
 */
export default function AnimatedBar({ pct = 0, color, height = 8, track, radius }) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  const v = useRef(new Animated.Value(clamped)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: clamped, duration: 600, useNativeDriver: false }).start();
  }, [clamped, v]);
  const r = radius == null ? height / 2 : radius;
  return (
    <View style={{ height, backgroundColor: track, borderRadius: r, overflow: 'hidden' }}>
      <Animated.View
        style={{
          height,
          borderRadius: r,
          backgroundColor: color,
          width: v.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}
