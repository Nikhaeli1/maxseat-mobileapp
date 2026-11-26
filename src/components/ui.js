import React, { useState, forwardRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from './Icon';
import { GradientFill } from './Gradient';
import { fieldFocused } from '../hooks/useKeyboardScroll';
import { COLORS, RADIUS, FONTS, SHADOW, TYPE, themed } from '../theme';

/**
 * Text box with a label above it, an optional icon, and (for passwords)
 * a show / hide eye button.
 *   <Field label="Password" icon="lock-closed-outline" secure value={pw} onChangeText={setPw} />
 */
export const Field = forwardRef(function Field(
  { label, icon, secure, error, hint, style, inputStyle, right, ...input }, ref,
) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <View style={[styles.fieldGroup, style]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrap,
        focused && styles.inputFocused,
        !!error && styles.inputError,
      ]}>
        {!!icon && <Icon name={icon} size={20} color={focused ? COLORS.accent : COLORS.textMuted} style={styles.leftIcon} />}
        <TextInput
          ref={ref}
          placeholderTextColor={COLORS.textMuted}
          {...input}
          style={[styles.input, inputStyle]}
          secureTextEntry={!!secure && !show}
          autoCapitalize={secure ? 'none' : input.autoCapitalize}
          autoCorrect={secure ? false : input.autoCorrect}
          onFocus={(e) => { setFocused(true); fieldFocused(); input.onFocus && input.onFocus(e); }}
          onBlur={(e) => { setFocused(false); input.onBlur && input.onBlur(e); }}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setShow((v) => !v)}
            style={styles.eyeBtn}
            accessibilityRole="button"
            accessibilityLabel={show ? 'Hide password' : 'Show password'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name={show ? 'eye-off-outline' : 'eye-outline'} size={21} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
        {right}
      </View>
      {!!(error || hint) && (
        <Text style={[styles.hint, !!error && styles.hintError]}>{error || hint}</Text>
      )}
    </View>
  );
});

/**
 * Big, easy-to-tap button.
 *   variant: 'primary' (green) | 'lime' (urgent) | 'soft' (light green) | 'outline' | 'ghost'
 */
export function Button({ label, onPress, loading, disabled, icon, variant = 'primary', style, small, ...rest }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const off = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={off}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={[styles.btn, small && styles.btnSmall, v.box(), off && styles.btnOff, style]}
      {...rest}
    >
      {!!v.gradient && <GradientFill name={v.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />}
      {loading
        ? <ActivityIndicator color={v.text()} />
        : (
          <View style={styles.btnRow}>
            {!!icon && <Icon name={icon} size={small ? 17 : 19} color={v.text()} />}
            <Text style={[styles.btnText, small && styles.btnTextSmall, { color: v.text() }]}>{label}</Text>
          </View>
        )}
    </TouchableOpacity>
  );
}

const VARIANTS = {
  primary: { gradient: 'button', box: () => ({ backgroundColor: COLORS.primary, ...SHADOW.button }), text: () => '#FFFFFF' },
  lime:    { gradient: 'lime',   box: () => ({ backgroundColor: COLORS.alert, ...SHADOW.button }),   text: () => COLORS.onAlert },
  soft:    { box: () => ({ backgroundColor: COLORS.primaryGlow }),               text: () => COLORS.accent },
  outline: { box: () => ({ backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.border }), text: () => COLORS.textPrimary },
  ghost:   { box: () => ({ backgroundColor: 'transparent' }),                    text: () => COLORS.accent },
};

/** Rounded white card. */
export function Card({ style, children, ...rest }) {
  return <View style={[styles.card, style]} {...rest}>{children}</View>;
}

/** Small heading over a group of things. Sentence case, easy to read. */
export function SectionTitle({ children, style, right }) {
  return (
    <View style={[styles.sectionRow, style]}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

const styles = themed(() => ({
  fieldGroup: { marginBottom: 16 },
  label:      { ...TYPE.label, color: COLORS.textSecondary, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    minHeight: 56, borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.inputBg, paddingHorizontal: 14,
  },
  inputFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.cardBg },
  inputError:   { borderColor: COLORS.danger },
  leftIcon:     { marginRight: 10 },
  input: {
    flex: 1, minWidth: 0, fontSize: 16, color: COLORS.textPrimary, fontFamily: FONTS.regular,
    fontWeight: '500', paddingVertical: 14,
  },
  eyeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: -6, borderRadius: 12 },
  hint:      { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary, marginTop: 6, fontFamily: FONTS.regular },
  hintError: { color: COLORS.danger, fontFamily: FONTS.semiBold, fontWeight: '600' },

  btn: {
    minHeight: 56, borderRadius: RADIUS.md, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  btnSmall:     { minHeight: 44, borderRadius: RADIUS.sm, paddingHorizontal: 14 },
  btnOff:       { opacity: 0.5 },
  btnRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText:      { fontSize: 16.5, fontFamily: FONTS.extraBold, fontWeight: '800', letterSpacing: 0.2 },
  btnTextSmall: { fontSize: 14.5 },

  card: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 18,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card,
  },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { ...TYPE.section, color: COLORS.textPrimary },
}));
