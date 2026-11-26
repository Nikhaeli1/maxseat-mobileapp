import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, TextInput } from 'react-native';

/**
 * Keeps the box you are typing in above the keyboard, on Android and iPhone.
 *
 *   const kb = useKeyboardScroll();
 *   <ScrollView {...kb.scrollProps} contentContainerStyle={...}>
 *     ...fields...
 *     <View style={{ height: kb.height }} />   // room to push the last field above the keyboard
 *   </ScrollView>
 *
 * Android now draws the app edge to edge, so the screen no longer shrinks when the
 * keyboard opens and KeyboardAvoidingView alone left fields hidden behind it. This adds
 * space under the form while the keyboard is up and scrolls the focused field into view.
 * It works the same whether or not the system shrinks the screen.
 */

// Field (components/ui.js) calls this, so moving to the next box while the keyboard
// is already open also scrolls it into view.
const focusListeners = new Set();
export function fieldFocused() {
  focusListeners.forEach((fn) => fn());
}

export default function useKeyboardScroll({ topGap = 110 } = {}) {
  const scrollRef = useRef(null);
  const view      = useRef({ y: 0, h: 0 });
  const kbHeight  = useRef(0);
  const [height, setHeight] = useState(0);

  const reveal = useCallback(() => {
    const input  = TextInput.State?.currentlyFocusedInput?.();
    const scroll = scrollRef.current;
    const inner  = scroll?.getInnerViewRef?.();
    if (!input || !inner || typeof input.measureLayout !== 'function') return;
    try {
      input.measureLayout(inner, (_x, y, _w, h) => {
        const top    = y - view.current.y;
        const bottom = top + h;
        const limit  = view.current.h - kbHeight.current - 24;   // what is still visible above the keyboard
        if (top >= 12 && bottom <= limit) return;                // already in view: don't jump
        scroll.scrollTo({ y: Math.max(0, y - topGap), animated: true });
      }, () => {});
    } catch (_) { /* field went away */ }
  }, [topGap]);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const onShow = (e) => {
      kbHeight.current = e?.endCoordinates?.height || 0;
      setHeight(kbHeight.current);
      setTimeout(reveal, ios ? 40 : 120);                         // after the extra space is laid out
    };
    const onHide = () => { kbHeight.current = 0; setHeight(0); };
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', onShow);
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', onHide);
    const onFocus = () => { if (kbHeight.current > 0) setTimeout(reveal, 60); };
    focusListeners.add(onFocus);
    return () => { show.remove(); hide.remove(); focusListeners.delete(onFocus); };
  }, [reveal]);

  const scrollProps = useMemo(() => ({
    ref: scrollRef,
    scrollEventThrottle: 32,
    onScroll: (e) => { view.current.y = e.nativeEvent.contentOffset.y; },
    onLayout: (e) => { view.current.h = e.nativeEvent.layout.height; },
  }), []);

  return { scrollProps, height, reveal };
}
