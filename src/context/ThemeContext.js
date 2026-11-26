import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setDarkMode, IS_DARK } from '../theme';

// Light or dark look for the whole app.
//   'light'  (default) · 'dark' · 'system' (follow the phone)
// Saved on the phone, so it stays the same next time the app opens.
const KEY = '@maxseat_theme';
const MODES = ['light', 'dark', 'system'];

const resolveDark = (mode) =>
  mode === 'dark' || (mode === 'system' && Appearance.getColorScheme() === 'dark');

/** Read the saved choice and apply it before any screen draws. Returns the mode. */
export async function loadSavedTheme() {
  let mode = 'light';
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (MODES.includes(saved)) mode = saved;
  } catch (_) {}
  setDarkMode(resolveDark(mode));
  return mode;
}

const ThemeCtx = createContext({ mode: 'light', dark: false, version: 0, setMode: () => {}, toggle: () => {} });
export const useThemeMode = () => useContext(ThemeCtx);

export function ThemeProvider({ initialMode = 'light', children }) {
  const [mode, setModeState] = useState(initialMode);
  // Goes up on every real switch; App.js uses it to redraw the screens in the new colors
  const [version, setVersion] = useState(0);

  const apply = useCallback((m) => {
    const dark = resolveDark(m);
    if (dark !== IS_DARK) {
      setDarkMode(dark);
      setVersion((v) => v + 1);
    }
  }, []);

  const setMode = useCallback((m) => {
    if (!MODES.includes(m)) return;
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
    apply(m);
  }, [apply]);

  // Quick switch used by the small sun/moon buttons
  const toggle = useCallback(() => setMode(IS_DARK ? 'light' : 'dark'), [setMode]);

  // In "Phone" mode, follow the phone when it changes while the app is open
  useEffect(() => {
    if (mode !== 'system') return undefined;
    const sub = Appearance.addChangeListener(() => apply('system'));
    return () => sub.remove();
  }, [mode, apply]);

  return (
    <ThemeCtx.Provider value={{ mode, dark: IS_DARK, version, setMode, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}
