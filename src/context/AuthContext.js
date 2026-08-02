import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginEnforcer, logoutEnforcer, saveToken, getToken,
  loginPassenger, logoutPassenger, registerPassenger,
} from '../api/apiService';

const AuthContext = createContext(null);

const USER_KEY        = '@maxseat_user';
const LAST_ROLE_KEY   = '@maxseat_last_role';
const ONBOARDING_KEY  = (role) => `@maxseat_onboarding_v2_${role}`;

export const AuthProvider = ({ children }) => {
  const [user,          setUser]          = useState(null);   // includes .role
  const [loading,       setLoading]       = useState(true);
  const [pendingRole,   setPendingRole]   = useState(null);   // pre-selects role on LoginScreen
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dashTutorialRequest, setDashTutorialRequest] = useState(null);

  // ── Restore session on launch ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [token, userJson, lastRole] = await Promise.all([
          getToken(),
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(LAST_ROLE_KEY),
        ]);
        if (token && userJson) {
          setUser(JSON.parse(userJson));
        } else if (lastRole) {
          setPendingRole(lastRole);
        }
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (username, password, role) => {
    let data;
    if (role === 'enforcer') {
      data = await loginEnforcer(username, password);
      if (!data.success) throw new Error(data.error || 'Login failed.');
    } else {
      data = await loginPassenger(username, password);
    }

    await saveToken(data.token);
    await AsyncStorage.setItem(LAST_ROLE_KEY, role);

    const profile = { ...data, role };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
    setPendingRole(null);

    // Show onboarding once per role
    const seen = await AsyncStorage.getItem(ONBOARDING_KEY(role));
    if (!seen) setShowOnboarding(true);
  };

  // ── Register (passenger only) ─────────────────────────────────────────────
  const register = async ({ username, password, full_name, mobile }) => {
    const data = await registerPassenger({ username, password, full_name, mobile });
    await saveToken(data.token);
    await AsyncStorage.setItem(LAST_ROLE_KEY, 'passenger');
    const profile = { ...data, role: 'passenger' };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
    setPendingRole(null);
    // New passengers always see onboarding
    setShowOnboarding(true);
  };

  // ── Complete onboarding ────────────────────────────────────────────────────
  const completeOnboarding = async (role) => {
    await AsyncStorage.setItem(ONBOARDING_KEY(role), '1');
    setShowOnboarding(false);
  };

  // ── Replay onboarding (called from settings) ───────────────────────────────
  const replayOnboarding = async (role) => {
    await AsyncStorage.removeItem(ONBOARDING_KEY(role));
    setShowOnboarding(true);
  };

  // ── Dashboard coach-mark tutorial request ─────────────────────────────────
  // useCallback keeps these stable across renders. Without it, any effect that
  // depends on them re-runs on every render and cancels its own pending work.
  const requestDashTutorial = useCallback(
    (role) => setDashTutorialRequest(role), []);
  const clearDashTutorialRequest = useCallback(
    () => setDashTutorialRequest(null), []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    const role = user?.role;
    if (role === 'enforcer') await logoutEnforcer();
    else await logoutPassenger();
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  };

  // ── Switch role (logout + return to login with new role pre-selected) ─────
  const switchRole = async (newRole) => {
    const role = user?.role;
    if (role === 'enforcer') await logoutEnforcer();
    else await logoutPassenger();
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.setItem(LAST_ROLE_KEY, newRole);
    setPendingRole(newRole);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, switchRole,
      pendingRole, setPendingRole,
      showOnboarding, completeOnboarding, replayOnboarding,
      dashTutorialRequest, requestDashTutorial, clearDashTutorialRequest,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
