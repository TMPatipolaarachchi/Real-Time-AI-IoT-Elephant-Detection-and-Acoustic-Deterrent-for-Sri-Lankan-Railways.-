import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling based on standard 375pt width (iPhone SE/8)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
export const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
export const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 360,
  isMedium: SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414,
  isLarge: SCREEN_WIDTH >= 414,
};

// ─── Color Palette ──────────────────────────────────────────
export const COLORS = {
  // Primary - Deep Forest Green
  primary: '#0A6847',
  primaryDark: '#064E3B',
  primaryLight: '#10B981',
  primarySurface: '#ECFDF5',
  primaryMuted: '#D1FAE5',

  // Accent - Golden Amber
  accent: '#F59E0B',
  accentDark: '#D97706',
  accentLight: '#FCD34D',
  accentSurface: '#FFFBEB',

  // Danger / Critical
  danger: '#DC2626',
  dangerDark: '#991B1B',
  dangerLight: '#FCA5A5',
  dangerSurface: '#FEF2F2',

  // Warning / High
  warning: '#EA580C',
  warningSurface: '#FFF7ED',

  // Info
  info: '#2563EB',
  infoLight: '#93C5FD',
  infoSurface: '#EFF6FF',

  // Success
  success: '#16A34A',
  successSurface: '#F0FDF4',

  // Neutrals
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#E2E8F0',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  textLink: '#2563EB',

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.6)',
  overlayLight: 'rgba(15, 23, 42, 0.08)',
};

// ─── Typography ─────────────────────────────────────────────
export const FONTS = {
  h1: {
    fontSize: moderateScale(28),
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.text,
  },
  h2: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    letterSpacing: -0.3,
    color: COLORS.text,
  },
  h3: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: COLORS.text,
  },
  h4: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: COLORS.text,
  },
  body: {
    fontSize: moderateScale(14),
    fontWeight: '400',
    lineHeight: moderateScale(20),
    color: COLORS.textSecondary,
  },
  bodyBold: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    lineHeight: moderateScale(20),
    color: COLORS.text,
  },
  caption: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: COLORS.textTertiary,
  },
  overline: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.textTertiary,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: moderateScale(13),
    color: COLORS.textSecondary,
  },
};

// ─── Spacing ────────────────────────────────────────────────
export const SPACING = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  base: moderateScale(16),
  lg: moderateScale(20),
  xl: moderateScale(24),
  '2xl': moderateScale(32),
  '3xl': moderateScale(40),
  '4xl': moderateScale(48),
};

// ─── Radius ─────────────────────────────────────────────────
export const RADIUS = {
  sm: moderateScale(6),
  md: moderateScale(10),
  lg: moderateScale(14),
  xl: moderateScale(18),
  '2xl': moderateScale(24),
  full: 9999,
};

// ─── Shadows ────────────────────────────────────────────────
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  colored: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  }),
};

// ─── Common Styles (Reusable) ───────────────────────────────
export const COMMON = {
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  cardElevated: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  inputField: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontSize: moderateScale(15),
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputFieldFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.colored(COLORS.primary),
  },
  buttonDanger: {
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.colored(COLORS.danger),
  },
  buttonText: {
    color: COLORS.textInverse,
    fontSize: moderateScale(15),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  screenPadding: {
    paddingHorizontal: SPACING.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 420,
    ...SHADOWS.xl,
  },
  modalContentLarge: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    width: SCREEN_WIDTH * 0.92,
    maxWidth: 500,
    maxHeight: SCREEN_HEIGHT * 0.8,
    ...SHADOWS.xl,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
};
