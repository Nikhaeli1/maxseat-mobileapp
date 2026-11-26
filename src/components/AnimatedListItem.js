import React, { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

/**
 * Wraps a list card in a short fade + slide-up the first time it appears.
 *
 * Usage:
 *   renderItem={({ item, index }) => (
 *     <AnimatedListItem index={index}>
 *       <MyCard item={item} />
 *     </AnimatedListItem>
 *   )}
 *
 * - JS-driven: on the new Android architecture a native-driven opacity can be
 *   reset to 0 by a re-render, and live lists re-render every refresh.
 * - The stagger is capped, so card 20 doesn't wait over a second.
 * - Once it has played, the animated style is dropped, so later refreshes
 *   can't touch it. A safety timer finishes it even if the animation stalls.
 */
const MAX_STAGGER = 6;

export default function AnimatedListItem({ index = 0, children }) {
  const [done, setDone] = useState(false);
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index, MAX_STAGGER) * 55;
    const anim = Animated.timing(p, { toValue: 1, duration: 320, delay, useNativeDriver: false });
    anim.start(({ finished }) => { if (finished) setDone(true); });
    const safety = setTimeout(() => setDone(true), delay + 900);
    return () => { anim.stop(); clearTimeout(safety); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  // Same element before and after, so the card is never remounted.
  return (
    <Animated.View
      style={done ? null : {
        opacity: p.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
        transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
