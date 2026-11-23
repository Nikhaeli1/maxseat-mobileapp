// ─── MaxSeat Design System: Forest & Lime (matches the web app) ─────────────
// Three colors only: forest green, white, lime. Everything else is a shade of these.
// Dark mode follows the phone's own setting. It is read once when the app starts,
// before any screen builds its styles, so every StyleSheet picks up the right colors.
import { Appearance } from 'react-native';

export const IS_DARK = Appearance.getColorScheme() === 'dark';

const LIGHT = {
  primary:       '#2F6F5A',
  primaryDark:   '#245847',
  primaryGlow:   'rgba(47,111,90,0.12)',

  // Header / strong surfaces
  dark:          '#2F6F5A',
  darkMid:       '#245847',
  darkBorder:    '#3A5248',

  pageBg:        '#EEF5F1',
  hoverBg:       '#F5F9F7',
  cardBg:        '#FFFFFF',
  inputBg:       '#F5F9F7',

  textPrimary:   '#14211B',
  textSecondary: '#5E6F67',
  textMuted:     '#8C9A93',
  textOnDark:    '#FFFFFF',

  border:        '#DCE8E1',
  borderLight:   '#EEF5F1',

  // Lime = "look here". Fill with dark text on top.
  alert:         '#C6F24E',
  onAlert:       '#14211B',

  // Urgent text (overloaded, overheating, errors). Readable on the page background.
  danger:        '#4D6B00',
  dangerDark:    '#3D5500',
  dangerBg:      'rgba(198,242,78,0.22)',
  dangerBorder:  'rgba(198,242,78,0.6)',

  // Calm "all good"
  success:       '#2F6F5A',
  successBg:     'rgba(47,111,90,0.10)',
  successBorder: 'rgba(47,111,90,0.2)',

  // Nearly full
  warning:       '#6E8F12',
  warningBg:     'rgba(198,242,78,0.16)',
  warningBorder: 'rgba(198,242,78,0.45)',

  statusBar:     'dark-content',
};

const DARK = {
  primary:       '#3E8A70',
  primaryDark:   '#2F6F5A',
  primaryGlow:   'rgba(198,242,78,0.12)',

  dark:          '#202522',
  darkMid:       '#262B28',
  darkBorder:    '#343A36',

  pageBg:        '#1B1F1D',
  hoverBg:       '#2E3430',
  cardBg:        '#262B28',
  inputBg:       '#2E3430',

  textPrimary:   '#FFFFFF',
  textSecondary: '#9BA8A1',
  textMuted:     '#7D8A83',
  textOnDark:    '#FFFFFF',

  border:        '#343A36',
  borderLight:   '#2E3430',

  alert:         '#C6F24E',
  onAlert:       '#14211B',

  danger:        '#C6F24E',
  dangerDark:    '#B5E23A',
  dangerBg:      'rgba(198,242,78,0.14)',
  dangerBorder:  'rgba(198,242,78,0.35)',

  success:       '#DCE8E1',
  successBg:     'rgba(255,255,255,0.08)',
  successBorder: 'rgba(255,255,255,0.16)',

  warning:       '#D4F570',
  warningBg:     'rgba(198,242,78,0.10)',
  warningBorder: 'rgba(198,242,78,0.3)',

  statusBar:     'light-content',
};

export const COLORS = { ...(IS_DARK ? DARK : LIGHT) };

// Both roles share the forest green UI color. Lime marks violations.
const roleBase = {
  primary:      COLORS.primary,
  primaryDark:  COLORS.primaryDark,
  primaryLight: IS_DARK ? 'rgba(198,242,78,0.12)' : 'rgba(47,111,90,0.10)',
  primaryMid:   IS_DARK ? '#4A6258' : '#C3D6CC',
  primaryGlow:  COLORS.primaryGlow,
  badgeColor:   COLORS.primary,
  gradFrom:     IS_DARK ? '#1B1F1D' : '#EEF5F1',
  gradTo:       IS_DARK ? '#262B28' : '#D2E2D9',
};

export const ROLE = {
  passenger: {
    ...roleBase,
    icon:  'bus-outline',
    label: 'Passenger',
  },
  enforcer: {
    ...roleBase,
    danger:       COLORS.danger,
    dangerBg:     COLORS.dangerBg,
    dangerBorder: COLORS.dangerBorder,
    icon:  'shield-checkmark-outline',
    label: 'Enforcer',
    badgeColor: COLORS.danger,
  },
};

export const SHADOW = {
  sm:     { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: IS_DARK ? 0.3 : 0.06, shadowRadius: 3  },
  md:     { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: IS_DARK ? 0.35 : 0.08, shadowRadius: 6  },
  button: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: IS_DARK ? 0.4 : 0.12, shadowRadius: 8  },
};

export const RADIUS = {
  sm:    10,
  md:    16,
  lg:    24,
  xl:    32,
  badge: 7,
  full:  999,
};

// ── Typography — Outfit (matches web backend font) ─────────────────────────
export const FONTS = {
  regular:   'Outfit_Regular',
  semiBold:  'Outfit_SemiBold',
  extraBold: 'Outfit_ExtraBold',
};

// ── Backward-compat aliases ───────────────────────────────────────────────────
SHADOW.card   = SHADOW.sm;
SHADOW.header = SHADOW.md;
COLORS.dangerLight  = COLORS.dangerBg;
COLORS.successLight = COLORS.successBg;
COLORS.warningLight = COLORS.warningBg;
