// ─── MaxSeat Design System: Forest & Lime (matches the web app) ─────────────
// Three colors only: forest green, white, lime. Everything else is a shade of these.
//
// Light mode is the default. Dark mode is a switch in Profile (and on the sign-in
// and dispatch screens), saved on the phone. See context/ThemeContext.js.
//
// How switching works without restarting the app:
//   • COLORS, ROLE and SHADOW are single objects that setDarkMode() refills in place,
//     so `COLORS.primary` always gives the current mode's color.
//   • Screens build their styles with themed(() => ({ ... })) instead of
//     StyleSheet.create({ ... }). It builds one sheet per mode, on first use.
//   • After a switch, App.js redraws the screens so everything picks up the change.
import { StyleSheet } from 'react-native';

// Current mode. A live binding: importers always see the latest value.
export let IS_DARK = false;

const LIGHT = {
  primary:       '#2F6F5A',
  primaryDark:   '#245847',
  primaryGlow:   'rgba(47,111,90,0.12)',

  // Header / strong surfaces
  dark:          '#2F6F5A',
  darkMid:       '#245847',
  darkBorder:    '#3A5248',

  pageBg:        '#F1F6F3',
  hoverBg:       '#F6FAF8',
  cardBg:        '#FFFFFF',
  inputBg:       '#F6FAF8',

  textPrimary:   '#14211B',
  textSecondary: '#55665E',
  textMuted:     '#7F8E87',
  textOnDark:    '#FFFFFF',

  border:        '#E2EBE6',
  borderLight:   '#EEF4F0',

  // Lime = "look here". Fill with dark text on top.
  alert:         '#C6F24E',
  overloadRed:   '#E5484D',   // map pins and badges for overloaded jeeps
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

  pageBg:        '#161A18',
  hoverBg:       '#2A302C',
  cardBg:        '#212623',
  inputBg:       '#2A302C',

  textPrimary:   '#FFFFFF',
  textSecondary: '#AAB6AF',
  textMuted:     '#86938C',
  textOnDark:    '#FFFFFF',

  border:        '#323935',
  borderLight:   '#2A302C',

  alert:         '#C6F24E',
  overloadRed:   '#E5484D',   // map pins and badges for overloaded jeeps
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

// Filled in by build() below, and refilled in place on every switch
export const COLORS = {};
export const ROLE   = { passenger: {}, enforcer: {} };
export const SHADOW = {};
// Gradient color pairs, used with <Gradient name="brand" /> (components/Gradient.js)
export const GRADIENT = {};

function build() {
  Object.assign(COLORS, IS_DARK ? DARK : LIGHT);
  // Green used for TEXT and ICONS (labels, links, "View details"). Same as primary in
  // light mode; a light mint in dark mode, because the button green is too dark to read
  // as text on the dark background. Buttons keep using primary with white text.
  COLORS.accent = IS_DARK ? '#9FD8BF' : COLORS.primary;
  COLORS.dangerLight  = COLORS.dangerBg;
  COLORS.successLight = COLORS.successBg;
  COLORS.warningLight = COLORS.warningBg;

  // Both roles share the forest green UI color. Lime marks violations.
  const roleBase = {
    primary:      COLORS.primary,
    accent:       COLORS.accent,
    primaryDark:  COLORS.primaryDark,
    primaryLight: IS_DARK ? 'rgba(198,242,78,0.12)' : 'rgba(47,111,90,0.10)',
    primaryMid:   IS_DARK ? '#4A6258' : '#C3D6CC',
    primaryGlow:  COLORS.primaryGlow,
    badgeColor:   COLORS.primary,
    gradFrom:     IS_DARK ? '#1B1F1D' : '#EEF5F1',
    gradTo:       IS_DARK ? '#262B28' : '#D2E2D9',
  };
  Object.assign(ROLE.passenger, roleBase, { icon: 'bus-outline', label: 'Passenger' });
  Object.assign(ROLE.enforcer, roleBase, {
    danger:       COLORS.danger,
    dangerBg:     COLORS.dangerBg,
    dangerBorder: COLORS.dangerBorder,
    icon:  'shield-checkmark-outline',
    label: 'Enforcer',
    badgeColor: COLORS.danger,
  });

  // Soft, wide shadows: cards look like they float a little off the page
  Object.assign(SHADOW, {
    sm:     { elevation: 2, shadowColor: '#14211B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: IS_DARK ? 0.35 : 0.06, shadowRadius: 10 },
    md:     { elevation: 5, shadowColor: '#14211B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: IS_DARK ? 0.4 : 0.09, shadowRadius: 20 },
    button: { elevation: 3, shadowColor: IS_DARK ? '#000' : '#2F6F5A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: IS_DARK ? 0.4 : 0.22, shadowRadius: 12 },
  });
  SHADOW.card   = SHADOW.sm;

  Object.assign(GRADIENT, {
    // Deep forest green, light at the top left and darker at the bottom right
    brand:  IS_DARK ? ['#2D604E', '#152C24'] : ['#3F8D70', '#1C4A3B'],
    button: IS_DARK ? ['#45937A', '#2B6653'] : ['#3F8D70', '#245847'],
    // Lime, for "look here" buttons and badges
    lime:   ['#E1FC84', '#B6E23A'],
    // Soft page wash behind the sign-in screens
    page:   IS_DARK ? ['#1C2320', '#121513'] : ['#F7FCF9', '#DFEDE5'],
    // Very light mint for highlighted cards
    mint:   IS_DARK ? ['rgba(198,242,78,0.12)', 'rgba(198,242,78,0.03)'] : ['#EFF9E1', '#FFFFFF'],
  });
  SHADOW.header = SHADOW.md;
}
build();

/** Switch every color to light (false) or dark (true). App.js then redraws the screens. */
export function setDarkMode(dark) {
  IS_DARK = !!dark;
  build();
}

/**
 * Any other table of colors that should follow the current mode
 * (badge colors, seat colors…):  const TABLE = byMode(() => ({ ... }));
 */
export function byMode(factory) {
  const built = {};
  const current = () => {
    const mode = IS_DARK ? 'dark' : 'light';
    if (!built[mode]) built[mode] = factory();
    return built[mode];
  };
  return new Proxy({}, {
    get: (_, key) => current()[key],
    has: (_, key) => key in current(),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_, key) => {
      const d = Object.getOwnPropertyDescriptor(current(), key);
      return d ? { ...d, configurable: true } : undefined;
    },
  });
}

/**
 * Styles that follow the current mode. Use instead of StyleSheet.create:
 *   const styles = themed(() => ({ card: { backgroundColor: COLORS.cardBg } }));
 * The factory runs once per mode, the first time a style is read.
 */
export function themed(factory) {
  const sheets = {};
  const current = () => {
    const mode = IS_DARK ? 'dark' : 'light';
    if (!sheets[mode]) sheets[mode] = StyleSheet.create(factory());
    return sheets[mode];
  };
  return new Proxy({}, {
    get: (_, key) => current()[key],
    has: (_, key) => key in current(),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_, key) => {
      const d = Object.getOwnPropertyDescriptor(current(), key);
      return d ? { ...d, configurable: true } : undefined;
    },
  });
}

export const RADIUS = {
  sm:    12,
  md:    16,
  lg:    22,
  xl:    28,
  badge: 8,
  full:  999,
};

// ── Typography — Outfit (matches web backend font) ─────────────────────────
export const FONTS = {
  regular:   'Outfit_Regular',
  semiBold:  'Outfit_SemiBold',
  extraBold: 'Outfit_ExtraBold',
};

// Text sizes, large enough to read at a glance for all ages. Spread into styles:
//   title: { ...TYPE.title, color: COLORS.textPrimary }
const t = (fontSize, lineHeight, fontFamily, fontWeight, extra) => ({ fontSize, lineHeight, fontFamily, fontWeight, ...extra });
export const TYPE = {
  display: t(32, 38, FONTS.extraBold, '800', { letterSpacing: -0.6 }),
  title:   t(26, 32, FONTS.extraBold, '800', { letterSpacing: -0.4 }),
  heading: t(20, 26, FONTS.extraBold, '800', { letterSpacing: -0.2 }),
  section: t(17, 22, FONTS.extraBold, '800'),
  body:    t(16, 23, FONTS.regular,   '500'),
  strong:  t(16, 22, FONTS.semiBold,  '700'),
  label:   t(14, 19, FONTS.semiBold,  '600'),
  caption: t(13, 18, FONTS.regular,   '500'),
};

// (Aliases SHADOW.card/header and COLORS.*Light are set in build() above.)
