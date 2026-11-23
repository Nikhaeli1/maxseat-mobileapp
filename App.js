import React, { useRef, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import RoleSwitchOverlay from './src/components/RoleSwitchOverlay';
import { ToastHost } from './src/components/Toast';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TutorialProvider } from './src/context/TutorialContext';
import { ThemeProvider, useThemeMode, loadSavedTheme } from './src/context/ThemeContext';
import { COLORS, ROLE, IS_DARK, themed } from './src/theme';

// ── Shared ────────────────────────────────────────────────────────────────────
import LoginScreen       from './src/screens/LoginScreen';
import RegisterScreen    from './src/screens/RegisterScreen';
import OnboardingScreen  from './src/screens/OnboardingScreen';

// ── Passenger ─────────────────────────────────────────────────────────────────
import PassengerTabs    from './src/navigation/PassengerTabs';
import PuvDetailScreen  from './src/screens/passenger/PuvDetailScreen';
import ComplaintScreen  from './src/screens/passenger/ComplaintScreen';

// ── Enforcer ──────────────────────────────────────────────────────────────────
import DispatchScreen from './src/screens/enforcer/DispatchScreen';
import ActionScreen   from './src/screens/enforcer/ActionScreen';

const Stack = createNativeStackNavigator();

// Where you were in the app. Kept so that switching light/dark mode (which
// redraws every screen) puts you back on the same screen.
let savedNavState;

function RootNavigator() {
  const { user, loading, showOnboarding } = useAuth();

  const splashFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(splashFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  if (loading) {
    return (
      <Animated.View style={[styles.splash, { opacity: splashFade }]}>
        <ActivityIndicator size="large" color={COLORS.textOnDark} />
      </Animated.View>
    );
  }

  const navTheme = {
    ...(IS_DARK ? DarkTheme : DefaultTheme),
    colors: {
      ...(IS_DARK ? DarkTheme : DefaultTheme).colors,
      primary: COLORS.primary, background: COLORS.pageBg, card: COLORS.cardBg,
      text: COLORS.textPrimary, border: COLORS.border,
    },
  };

  return (
    <NavigationContainer
      theme={navTheme}
      initialState={savedNavState}
      onStateChange={(state) => { savedNavState = state; }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // Default: smooth cross-fade for role switches / login → home
          animation: 'fade',
          animationDuration: 280,
          // Subtle iOS-style presentation
          contentStyle: { backgroundColor: COLORS.pageBg },
        }}
      >
        {!user ? (
          // ── Unauthenticated ─────────────────────────────────────────────────
          <>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ animation: 'slide_from_right', animationDuration: 250 }}
            />
          </>
        ) : showOnboarding ? (
          // ── Onboarding (one-time per role) ──────────────────────────────────
          <>
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ animation: 'fade', animationDuration: 350 }}
            />
          </>
        ) : user.role === 'enforcer' ? (
          // ── Enforcer App ────────────────────────────────────────────────────
          <>
            <Stack.Screen name="Dispatch" component={DispatchScreen} />
            <Stack.Screen
              name="Action"
              component={ActionScreen}
              options={{ animation: 'slide_from_right', animationDuration: 250 }}
            />
          </>
        ) : (
          // ── Passenger App ───────────────────────────────────────────────────
          <>
            <Stack.Screen name="MainTabs" component={PassengerTabs} />
            <Stack.Screen
              name="PuvDetail"
              component={PuvDetailScreen}
              options={{ animation: 'slide_from_right', animationDuration: 250 }}
            />
            <Stack.Screen
              name="Complaint"
              component={ComplaintScreen}
              options={{ animation: 'slide_from_right', animationDuration: 250 }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Full-screen Passenger ⇄ Enforcer transition, drawn above everything.
function RoleSwitchHost() {
  const { roleSwitch } = useAuth();
  const last = useRef({ from: 'passenger', to: 'enforcer' });
  if (roleSwitch) last.current = roleSwitch;
  return <RoleSwitchOverlay active={!!roleSwitch} from={last.current.from} to={last.current.to} />;
}

// Everything that has to be redrawn when light/dark mode changes. The `key`
// makes React rebuild it with the new colors; sign-in state lives above it.
function ThemedShell() {
  const { version } = useThemeMode();
  return (
    <View key={version} style={{ flex: 1, backgroundColor: COLORS.pageBg }}>
      {/* TutorialProvider sits ABOVE the navigator so coach marks can cover
          the tab bar while staying in the same window as the elements they
          measure — both are required for the highlights to line up. */}
      <TutorialProvider>
        <RootNavigator />
      </TutorialProvider>
      <RoleSwitchHost />
      <ToastHost />
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialMode, setInitialMode] = useState('light');

  useEffect(() => {
    const fonts = Font.loadAsync({
      Outfit_Regular:   require('./assets/fonts/Outfit_400Regular.ttf'),
      Outfit_SemiBold:  require('./assets/fonts/Outfit_600SemiBold.ttf'),
      Outfit_ExtraBold: require('./assets/fonts/Outfit_800ExtraBold.ttf'),
    }).catch(() => {});                    // fall back to system font if anything fails
    const theme = loadSavedTheme().then(setInitialMode).catch(() => {});
    Promise.all([fonts, theme]).then(() => setReady(true));
  }, []);

  // Same color as the launch screen, so there's no white flash while loading
  if (!ready) return <View style={styles.splash} />;

  return (
    <ThemeProvider initialMode={initialMode}>
      <AuthProvider>
        <ThemedShell />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = themed(() => ({
  splash: {
    flex:            1,
    backgroundColor: COLORS.dark,
    justifyContent:  'center',
    alignItems:      'center',
  },
}));
