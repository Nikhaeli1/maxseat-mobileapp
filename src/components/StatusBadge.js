import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONTS } from '../theme';
import Icon from './Icon';

// Colors match web badge system exactly
const CONFIGS = {
  critical: { bg: COLORS.alert,             text: COLORS.onAlert, border: COLORS.alert            },
  warning:  { bg: 'rgba(198,242,78,0.1)',  text: COLORS.warning, border: 'rgba(198,242,78,0.2)'  },
  success:  { bg: 'rgba(47,111,90,0.1)',  text: COLORS.success, border: 'rgba(47,111,90,0.2)'  },
  info:     { bg: 'rgba(47,111,90,0.1)',   text: COLORS.primary, border: 'rgba(47,111,90,0.2)'   },
  gray:     { bg: COLORS.hoverBg,               text: COLORS.textSecondary, border: COLORS.border               },
};

const LABELS = {
  OVERLOAD:  { variant: 'critical', icon: 'alert-circle', text: 'OVERLOAD'  },
  THERMAL:   { variant: 'warning',  icon: 'thermometer',  text: 'THERMAL'   },
  ticket:    { variant: 'critical', icon: 'document-text', text: 'TICKET'   },
  warning:   { variant: 'warning',  icon: 'warning',      text: 'WARNING'   },
  apprehend: { variant: 'info',     icon: 'car',          text: 'APPREHEND' },
  PENDING:   { variant: 'warning',  icon: 'time',         text: 'PENDING'   },
  RESOLVED:  { variant: 'success',  icon: 'checkmark',    text: 'RESOLVED'  },
};

export default function StatusBadge({ type, variant, label }) {
  const cfg    = LABELS[type] || { variant: variant || 'gray', icon: '', text: type };
  const colors = CONFIGS[variant || cfg.variant] || CONFIGS.gray;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {cfg.icon ? <Icon name={cfg.icon} size={11} color={colors.text} style={styles.icon} /> : null}
      <Text style={[styles.text, { color: colors.text }]}>{label || cfg.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    alignSelf:         'flex-start',
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      RADIUS.badge,
    borderWidth:       1,
  },
  icon: { marginRight: 4 },
  text: { fontSize: 10, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', letterSpacing: 0.4 },
});
