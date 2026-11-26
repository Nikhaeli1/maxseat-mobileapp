import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../theme';

/**
 * Line icons (Ionicons) used across the app instead of emoji.
 * Names: https://icons.expo.fyi (filter by Ionicons)
 *   <Icon name="bus-outline" size={20} color={COLORS.primary} />
 */
export default function Icon({ name, size = 18, color = COLORS.textSecondary, style }) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
