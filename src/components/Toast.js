import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOW, FONTS, IS_DARK, themed } from '../theme';

// A short message that slides up from the bottom and goes away on its own.
//   import { showToast } from '../components/Toast';
//   showToast('Saved');
let listener = null;
export function showToast(text, { duration = 2600 } = {}) {
  if (listener) listener({ text, duration, id: Date.now() + Math.random() });
}

export function ToastHost() {
  const [toast, setToast] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    listener = setToast;
    return () => { if (listener === setToast) listener = null; };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, tension: 90, friction: 11, useNativeDriver: false }).start();
    const hide = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: false }).start();
    }, toast.duration);
    const clear = setTimeout(() => setToast((t) => (t && t.id === toast.id ? null : t)), toast.duration + 300);
    return () => { clearTimeout(hide); clearTimeout(clear); };
  }, [toast, anim]);

  if (!toast) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, {
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
      }]}
    >
      <Text style={styles.text}>{toast.text}</Text>
    </Animated.View>
  );
}

const styles = themed(() => ({
  wrap: {
    position: 'absolute', left: 20, right: 20, bottom: 96,
    backgroundColor: IS_DARK ? '#2E3430' : '#14211B',
    borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.alert,
    ...SHADOW.button,
  },
  text: { color: '#FFFFFF', fontSize: 15, lineHeight: 19, fontFamily: FONTS.semiBold, fontWeight: '600' },
}));
