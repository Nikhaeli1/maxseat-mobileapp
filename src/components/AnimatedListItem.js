import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Wraps a list card in a staggered fade + slide-up animation.
 *
 * Usage:
 *   renderItem={({ item, index }) => (
 *     <AnimatedListItem index={index}>
 *       <MyCard item={item} />
 *     </AnimatedListItem>
 *   )}
 */
export default function AnimatedListItem({ index = 0, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue:  1,
        duration: 320,
        delay:    index * 60,   // stagger each card by 60 ms
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue:  0,
        friction: 8,
        tension:  70,
        delay:    index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
