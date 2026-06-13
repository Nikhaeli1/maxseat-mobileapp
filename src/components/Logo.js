import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

/**
 * MaxSeat brand logo.
 *
 * size="full"    – login screen hero (default, ~140 wide)
 * size="header"  – compact header strip (~90 wide)
 * size="small"   – inline / tab bar  (~60 wide)
 */
export default function Logo({ size = 'full', style }) {
  const dims = SIZES[size] || SIZES.full;
  return (
    <View style={[{ width: dims.width, height: dims.height }, style]}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.img}
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

const styles = StyleSheet.create({
  img: { width: '100%', height: '100%' },
});
