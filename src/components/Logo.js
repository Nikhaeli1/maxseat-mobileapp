import React from 'react';
import { themed } from '../theme';
import { Image, StyleSheet, View } from 'react-native';

/**
 * MaxSeat brand logo.
 *
 * size="full"    – login screen hero (default, ~140 wide)
 * size="header"  – compact header strip (~90 wide)
 * size="small"   – inline / tab bar  (~60 wide)
 * onDark         – all-white logo for green / gradient headers
 */
export default function Logo({ size = 'full', style, onDark = false }) {
  const dims = SIZES[size] || SIZES.full;
  return (
    <View style={[{ width: dims.width, height: dims.height }, style]}>
      <Image
        source={require('../../assets/logo.png')}
        style={[styles.img, onDark && { tintColor: '#FFFFFF' }]}
        resizeMode="contain"
      />
    </View>
  );
}

// Original logo aspect ratio ≈ 2.6 : 1  (width : height)
const SIZES = {
  full:   { width: 160, height: 62 },
  header: { width: 100, height: 38 },
  small:  { width: 68,  height: 26 },
};

const styles = themed(() => ({
  img: { width: '100%', height: '100%' },
}));
