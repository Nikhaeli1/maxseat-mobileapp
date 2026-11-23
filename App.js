import React, { useRef, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import RoleSwitchOverlay from './src/components/RoleSwitchOverlay';
import { ToastHost } from './src/components/Toast';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TutorialProvider } from './src/context/TutorialContext';
import { COLORS, ROLE } from './src/theme';

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

  return (
    <NavigationContainer>
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

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      Outfit_Regular:   require('./assets/fonts/Outfit_400Regular.ttf'),
      Outfit_SemiBold:  require('./assets/fonts/Outfit_600SemiBold.ttf'),
      Outfit_ExtraBold: require('./assets/fonts/Outfit_800ExtraBold.ttf'),
    })
      .then(() => setFontsLoaded(true))
      .catch(() => setFontsLoaded(true));  // fall back to system font if anything fails
  }, []);

  // Same color as the launch screen, so there's no white flash while fonts load
  if (!fontsLoaded) return <View style={styles.splash} />;

  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        {/* TutorialProvider sits ABOVE the navigator so coach marks can cover
            the tab bar while staying in the same window as the elements they
            measure — both are required for the highlights to line up. */}
        <TutorialProvider>
          <RootNavigator />
        </TutorialProvider>
        <RoleSwitchHost />
        <ToastHost />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex:            1,
    backgroundColor: COLORS.dark,
    justifyContent:  'center',
    alignItems:      'center',
  },
});
