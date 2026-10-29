/**
 * TutorialContext — hosts the coach-mark overlay at the ROOT of the app.
 *
 * WHY THIS EXISTS
 *   Coach marks need two things that conflict when the overlay is mounted
 *   inside a screen:
 *
 *   1. It must cover the tab bar. The navigator renders the tab bar as a
 *      sibling of the screen, so a screen-level overlay can never reach it.
 *   2. Its coordinates must match the elements it highlights. `measureInWindow`
 *      is only comparable between views in the SAME native window — a <Modal>
 *      creates its own window, so measurements taken there don't line up with
 *      targets in the main tree. That was the source of the misalignment.
 *
 *   Mounting the overlay at the app root, as a sibling of NavigationContainer,
 *   satisfies both: it paints over everything including the tab bar, and it
 *   stays in the same window as every element it measures.
 *
 * USAGE
 *   const { startTutorial } = useTutorial();
 *   startTutorial(steps, { accentColor, onDone });
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import TutorialOverlay from '../components/TutorialOverlay';
import { useAuth } from './AuthContext';

const TutorialContext = createContext({
  startTutorial: () => {},
  stopTutorial:  () => {},
  active:        false,
});

export const useTutorial = () => useContext(TutorialContext);

export function TutorialProvider({ children }) {
  const [tour, setTour] = useState(null);   // { steps, accentColor, onDone }

  const startTutorial = useCallback((steps, opts = {}) => {
    if (!steps || steps.length === 0) return;
    setTour({ steps, accentColor: opts.accentColor, onDone: opts.onDone });
  }, []);

  const stopTutorial = useCallback(() => setTour(null), []);

  // Never carry a tour across logout / role switch / onboarding: the overlay
  // sits above the whole app, so a leftover tour would darken every screen.
  const { user, showOnboarding } = useAuth();
  const userKey = user ? `${user.role}:${user.username}` : '';
  useEffect(() => { setTour(null); }, [userKey, showOnboarding]);

  const handleDone = useCallback(() => {
    tour?.onDone?.();
    setTour(null);
  }, [tour]);

  const value = useMemo(
    () => ({ startTutorial, stopTutorial, active: !!tour }),
    [startTutorial, stopTutorial, tour]
  );

  return (
    <TutorialContext.Provider value={value}>
      <View style={styles.root}>
        {children}

        {/* Rendered last → paints above the navigator, tab bar included. */}
        {tour && (
          <TutorialOverlay
            visible
            steps={tour.steps}
            accentColor={tour.accentColor}
            onDone={handleDone}
          />
        )}
      </View>
    </TutorialContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
