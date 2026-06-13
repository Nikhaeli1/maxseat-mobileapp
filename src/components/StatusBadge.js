import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RADIUS , FONTS} from '../theme';

// Colors match web badge system exactly
const CONFIGS = {
  critical: { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444', border: 'rgba(239,68,68,0.2)'   },
  warning:  { bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b', border: 'rgba(245,158,11,0.2)'  },
  success:  { bg: 'rgba(16,185,129,0.1)',  text: '#10b981', border: 'rgba(16,185,129,0.2)'  },
  info:     { bg: 'rgba(37,99,235,0.1)',   text: '#2563eb', border: 'rgba(37,99,235,0.2)'   },
  gray:     { bg: '#f8fafc',               text: '#64748b', border: '#e2e8f0'               },
};

const LABELS = {
  OVERLOAD:  { variant: 'critical', icon: '⚠',  text: 'OVERLOAD'  },
  THERMAL:   { variant: 'warning',  icon: '🌡',  text: 'THERMAL'   },
  ticket:    { variant: 'critical', icon: '📋',  text: 'TICKET'    },
  warning:   { variant: 'warning',  icon: '⚠',  text: 'WARNING'   },
  apprehend: { variant: 'info',     icon: '🚔',  text: 'APPREHEND' },
  PENDING:   { variant: 'warning',  icon: '⏳',  text: 'PENDING'   },
  RESOLVED:  { variant: 'success',  icon: '✓',   text: 'RESOLVED'  },
};

export default function StatusBadge({ type, variant, label }) {
  const cfg    = LABELS[type] || { variant: variant || 'gray', icon: '', text: type };
  const colors = CONFIGS[variant || cfg.variant] || CONFIGS.gray;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {cfg.icon ? <Text style={[styles.icon, { color: colors.text }]}>{cfg.icon} </Text> : null}
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
  icon: { fontSize: 11 },
  text: { fontSize: 10, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', letterSpacing: 0.4 },
});
