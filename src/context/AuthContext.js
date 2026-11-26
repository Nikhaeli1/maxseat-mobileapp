import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginEnforcer, logoutEnforcer, saveToken, getToken, clearToken,
  loginPassenger, logoutPassenger, registerPassenger, setUnauthorizedHandler,
} from '../api/apiService';

const AuthContext = createContext(null);

const USER_KEY        = '@maxseat_user';
const LAST_ROLE_KEY   = '@maxseat_last_role';
const ONBOARDING_KEY  = (role) => `@maxseat_onboarding_v3_${role}`;
const LAST_USERNAME_KEY = (role) => `@maxseat_last_username_${role}`;

// Last username used for a role, so the sign-in form can fill it in.
export const getLastUsername = (role) => AsyncStorage.getItem(LAST_USERNAME_KEY(role)).catch(() => null);

export const AuthProvider = ({ children }) => {
  const [user,          setUser]          = useState(null);   // includes .role
  const [loading,       setLoading]       = useState(true);
  const [pendingRole,   setPendingRole]   = useState(null);   // pre-selects role on LoginScreen
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dashTutorialRequest, setDashTutorialRequest] = useState(null);
  const [roleSwitch,    setRoleSwitch]    = useState(null);   // { from, to } while the switch animation plays

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
          // Stay signed in: the saved login is used until you sign out or it expires
          const saved = JSON.parse(userJson);
          if (saved.token) {               // older versions also saved the token here
            delete saved.token;
            AsyncStorage.setItem(USER_KEY, JSON.stringify(saved)).catch(() => {});
          }
          setUser(saved);
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
    AsyncStorage.setItem(LAST_USERNAME_KEY(role), username).catch(() => {});

    const { token: _t, success: _s, ...details } = data;   // the token lives in encrypted storage only
    const profile = { ...details, role };
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
    AsyncStorage.setItem(LAST_USERNAME_KEY('passenger'), username).catch(() => {});
    const { token: _t, ...details } = data;
    const profile = { ...details, role: 'passenger' };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
    setPendingRole(null);
    // New passengers always see onboarding
    setShowOnboarding(true);
  };

  // ── Session expired (any 401 from the server) ─────────────────────────────
  // Signs out locally once and says why, instead of every screen showing
  // its own error. Registered once; reads the latest user through a ref.
  const userRef = useRef(null);
  userRef.current = user;
  useEffect(() => {
    let busy = false;
    setUnauthorizedHandler(async () => {
      if (busy || !userRef.current) return;
      busy = true;
      try {
        await clearToken();
        await AsyncStorage.removeItem(USER_KEY);
        setPendingRole(userRef.current.role);
      } catch (_) {}
      setUser(null);
      Alert.alert('Session expired', 'Please sign in again.');
      setTimeout(() => { busy = false; }, 3000);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // ── Update saved user details (e.g. after editing the profile) ────────────
  const updateUser = useCallback(async (patch) => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, ...patch };
      AsyncStorage.setItem(USER_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

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
  // The cover animation plays first; the sign-out happens behind it, then the
  // cover lifts to reveal sign-in with the new role picked.
  const switchRole = async (newRole) => {
    const role = user?.role;
    setRoleSwitch({ from: role || 'passenger', to: newRole });
    await new Promise((r) => setTimeout(r, 520));
    try {
      try {
        if (role === 'enforcer') await logoutEnforcer();
        else await logoutPassenger();
      } catch (e) {
        // signing out on the server failed; still switch locally
      }
      await AsyncStorage.removeItem(USER_KEY);
      await AsyncStorage.setItem(LAST_ROLE_KEY, newRole);
    } finally {
      setPendingRole(newRole);
      setUser(null);
      // always lift the cover, whatever happened above
      setTimeout(() => setRoleSwitch(null), 450);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, switchRole, roleSwitch, updateUser,
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
