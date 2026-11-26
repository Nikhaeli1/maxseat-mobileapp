import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

/**
 * A card you can press: it sinks slightly under your finger and springs back.
 * JS-driven on purpose (see OnboardingScreen) so it can't get stuck on Android.
 */
export default function PressableScale({ style, children, onPress, scaleTo = 0.975, disabled, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(scale, { toValue: v, tension: 320, friction: 22, useNativeDriver: false }).start();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      disabled={disabled}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
