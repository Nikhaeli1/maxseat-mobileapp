// ─── MaxSeat Design System — matched to web backend (layout.html) ────────────

export const COLORS = {
  // Primary (--primary in web)
  primary:       '#2563eb',
  primaryDark:   '#1d4ed8',
  primaryGlow:   'rgba(37,99,235,0.12)',

  // Dark surfaces — sidebar/header bg (#0f172a in web)
  dark:          '#0f172a',
  darkMid:       '#1e293b',
  darkBorder:    '#334155',

  // Page / card backgrounds
  pageBg:        '#f1f5f9',   // --bg in web
  hoverBg:       '#f8fafc',   // --hover-bg in web
  cardBg:        '#ffffff',
  inputBg:       '#f8fafc',

  // Text
  textPrimary:   '#0f172a',
  textSecondary: '#64748b',
  textMuted:     '#94a3b8',
  textOnDark:    '#f1f5f9',

  // Borders
  border:        '#e2e8f0',
  borderLight:   '#f1f5f9',

  // Semantic — exact web values
  danger:        '#ef4444',
  dangerDark:    '#dc2626',
  dangerBg:      'rgba(239,68,68,0.1)',
  dangerBorder:  'rgba(239,68,68,0.2)',

  success:       '#10b981',   // --success in web
  successBg:     'rgba(16,185,129,0.1)',
  successBorder: 'rgba(16,185,129,0.2)',

  warning:       '#f59e0b',
  warningBg:     'rgba(245,158,11,0.1)',
  warningBorder: 'rgba(245,158,11,0.2)',
};

// Both roles use blue as UI primary (matching web sidebar nav)
// Red is used only as violation/danger accent in enforcer mode
export const ROLE = {
  passenger: {
    primary:      '#2563eb',
    primaryDark:  '#1d4ed8',
    primaryLight: 'rgba(37,99,235,0.1)',
    primaryMid:   '#bfdbfe',
    primaryGlow:  'rgba(37,99,235,0.12)',
    icon:         '🚌',
    label:        'Passenger',
    badgeColor:   '#2563eb',
    // login gradient background
    gradFrom:     '#eff6ff',
    gradTo:       '#dbeafe',
  },
  enforcer: {
    primary:      '#2563eb',
    primaryDark:  '#1d4ed8',
    primaryLight: 'rgba(37,99,235,0.1)',
    primaryMid:   '#bfdbfe',
    primaryGlow:  'rgba(37,99,235,0.12)',
    // violation/danger accent
    danger:       '#ef4444',
    dangerBg:     'rgba(239,68,68,0.08)',
    dangerBorder: 'rgba(239,68,68,0.2)',
    icon:         '🛡',
    label:        'Enforcer',
    badgeColor:   '#ef4444',
    // login gradient background
    gradFrom:     '#fff1f2',
    gradTo:       '#fecaca',
  },
};

export const SHADOW = {
  sm:     { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3  },
  md:     { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6  },
  button: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8  },
};

export const RADIUS = {
  sm:    10,
  md:    16,
  lg:    24,
  xl:    32,
  badge: 7,
  full:  999,
};

// ── Typography — Plus Jakarta Sans (matches web backend font) ─────────────────
export const FONTS = {
  regular:   'PlusJakartaSans_Regular',
  semiBold:  'PlusJakartaSans_SemiBold',
  extraBold: 'PlusJakartaSans_ExtraBold',
};

// ── Backward-compat aliases ───────────────────────────────────────────────────
SHADOW.card   = SHADOW.sm;
SHADOW.header = SHADOW.md;
COLORS.dangerLight  = COLORS.dangerBg;
COLORS.successLight = COLORS.successBg;
COLORS.warningLight = COLORS.warningBg;
