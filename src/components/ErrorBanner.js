import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONTS, themed } from '../theme';
import { friendlyError } from '../api/errors';

/** Small inline notice with a Retry button. Replaces pop-up error alerts. */
export default function ErrorBanner({ error, onRetry, busy, style }) {
  if (!error) return null;
  return (
    <View style={[styles.box, style]}>
      <Text style={styles.text}>{friendlyError(error)}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} disabled={busy} style={styles.btn} activeOpacity={0.8}>
          <Text style={styles.btnText}>{busy ? 'Trying…' : 'Retry'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = themed(() => ({
  box:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.dangerBg, borderColor: COLORS.dangerBorder, borderWidth: 1, borderRadius: RADIUS.md, paddingVertical: 10, paddingHorizontal: 12 },
  text:    { flex: 1, fontSize: 14, lineHeight: 17, color: COLORS.textPrimary, fontFamily: FONTS.semiBold, fontWeight: '600' },
  btn:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 7 },
  btnText: { color: '#fff', fontSize: 13.5, fontFamily: FONTS.extraBold, fontWeight: '800' },
}));
