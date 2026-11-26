import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, Pressable, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import Icon from './Icon';
import { GradientFill } from './Gradient';
import { COLORS, RADIUS, FONTS, IS_DARK, themed } from '../theme';

/**
 * MaxSeat pop-up, used instead of the phone's plain Alert box.
 * Same call shape as Alert.alert, so swapping is one word:
 *
 *   import { showAlert } from '../components/Dialog';
 *   showAlert('Log Out', 'End your session?', [
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'Log Out', style: 'destructive', onPress: logout },
 *   ]);
 *
 * Optional 4th argument: { icon: 'checkmark-circle', tone: 'success' | 'danger' | 'info' | 'question' }.
 * Without it the icon is picked from the buttons and the title.
 * Pop-ups opened while one is showing wait their turn (e.g. "Submitted" after "Confirm").
 */

let open = null;            // set by <DialogHost />
const waiting = [];

export function showAlert(title, message, buttons, options = {}) {
  const item = { title, message, buttons: buttons && buttons.length ? buttons : [{ text: 'OK' }], options };
  if (!open) {               // host not mounted yet: fall back to the plain box
    Alert.alert(title, message, item.buttons);
    return;
  }
  open(item);
}

function pickLook(item) {
  const { title = '', buttons, options } = item;
  if (options.tone || options.icon) {
    const tone = options.tone || 'info';
    return { tone, icon: options.icon || TONE_ICON[tone] };
  }
  if (buttons.some((b) => b.style === 'destructive')) return { tone: 'danger', icon: 'alert-circle' };
  if (/couldn.?t|error|failed|expired|mismatch|too short|required/i.test(title)) return { tone: 'danger', icon: 'alert-circle' };
  if (/submitted|sent|saved|done|success/i.test(title)) return { tone: 'success', icon: 'checkmark-circle' };
  if (buttons.length > 1) return { tone: 'question', icon: 'help-circle' };
  return { tone: 'info', icon: 'information-circle' };
}
const TONE_ICON = { success: 'checkmark-circle', danger: 'alert-circle', info: 'information-circle', question: 'help-circle' };

export function DialogHost() {
  const [item, setItem] = useState(null);       // what the pop-up shows (kept while it fades out)
  const [visible, setVisible] = useState(false);
  const showing = useRef(false);
  const pop = useRef(new Animated.Value(1)).current;   // scale only (no opacity): never leaves the card invisible

  useEffect(() => {
    open = (next) => {
      if (showing.current) { waiting.push(next); return; }
      showing.current = true;
      pop.setValue(0);
      setItem(next);
      setVisible(true);
      Animated.spring(pop, { toValue: 1, tension: 140, friction: 13, useNativeDriver: false }).start();
    };
    return () => { open = null; };
  }, [pop]);

  const close = (button) => {
    if (!showing.current) return;
    setVisible(false);
    // Let the pop-up fade out before the action runs or the next one opens
    setTimeout(() => {
      showing.current = false;
      try { button && button.onPress && button.onPress(); } catch (e) { /* the screen handles its own errors */ }
      const next = waiting.shift();
      if (next) setTimeout(() => open && open(next), 60);
    }, 200);
  };

  if (!item) return null;
  const { tone, icon } = pickLook(item);
  const buttons = [...item.buttons].sort((a, b) => (a.style === 'cancel' ? -1 : 0) - (b.style === 'cancel' ? -1 : 0));
  const cancel  = buttons.find((b) => b.style === 'cancel') || (buttons.length === 1 ? buttons[0] : null);
  const stacked = buttons.length > 2;
  const t = TONES()[tone];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => cancel && close(cancel)}>
      <Pressable style={styles.backdrop} onPress={() => cancel && close(cancel)}>
        <Animated.View
          style={[styles.card, { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}
          onStartShouldSetResponder={() => true}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
            <Icon name={icon} size={28} color={t.fg} />
          </View>
          {!!item.title && <Text style={styles.title}>{item.title}</Text>}
          {!!item.message && <Text style={styles.message}>{item.message}</Text>}

          <View style={[styles.buttons, stacked && styles.buttonsStacked]}>
            {buttons.map((b, i) => {
              const kind = b.style === 'cancel' ? 'cancel' : b.style === 'destructive' ? 'danger' : 'primary';
              return (
                <TouchableOpacity
                  key={`${b.text}-${i}`}
                  onPress={() => close(b)}
                  activeOpacity={0.85}
                  style={[styles.btn, !stacked && { flex: 1 }, kind === 'cancel' && styles.btnCancel, kind === 'danger' && styles.btnDanger]}
                  accessibilityRole="button"
                >
                  {kind === 'primary' && <GradientFill name="button" />}
                  <Text style={[styles.btnText, kind === 'cancel' && styles.btnCancelText, kind === 'danger' && styles.btnDangerText]}>
                    {b.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const TONES = () => ({
  success:  { bg: COLORS.successBg, fg: COLORS.success },
  danger:   { bg: COLORS.alert, fg: COLORS.onAlert },
  info:     { bg: IS_DARK ? 'rgba(255,255,255,0.08)' : 'rgba(47,111,90,0.10)', fg: COLORS.accent },
  question: { bg: IS_DARK ? 'rgba(255,255,255,0.08)' : 'rgba(47,111,90,0.10)', fg: COLORS.accent },
});

const W = Dimensions.get('window').width;

const styles = themed(() => ({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,16,13,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    width: Math.min(360, W - 48), backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    paddingHorizontal: 22, paddingTop: 24, paddingBottom: 20, alignItems: 'center',
    borderWidth: IS_DARK ? 1 : 0, borderColor: COLORS.border,
    shadowColor: '#0B1410', shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title:    { fontSize: 19, lineHeight: 25, fontFamily: FONTS.extraBold, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  message:  { fontSize: 14.5, lineHeight: 21, fontFamily: FONTS.regular, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 },
  buttons:  { flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' },
  buttonsStacked: { flexDirection: 'column' },
  btn:      { height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, overflow: 'hidden', backgroundColor: COLORS.primary },
  btnText:  { color: '#FFFFFF', fontSize: 15.5, fontFamily: FONTS.extraBold, fontWeight: '800' },
  btnCancel:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.border },
  btnCancelText: { color: COLORS.textPrimary },
  btnDanger:     { backgroundColor: COLORS.alert },
  btnDangerText: { color: COLORS.onAlert },
}));
