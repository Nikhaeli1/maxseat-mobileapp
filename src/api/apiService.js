import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Server address (Vercel). To point the app somewhere else without editing code,
// set EXPO_PUBLIC_API_URL in a .env file, e.g. EXPO_PUBLIC_API_URL=http://192.168.1.5:8000
export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://maxseat-final.vercel.app').replace(/\/+$/, '');

// CARTO map style key (optional). Put EXPO_PUBLIC_CARTO_KEY=... in a .env file.
// Without it, maps use free OpenStreetMap tiles.
export const CARTO_KEY = (process.env.EXPO_PUBLIC_CARTO_KEY || '').trim();

// The login token is kept in the phone's encrypted storage (Keychain / Keystore),
// not in plain app storage. Older versions kept it in AsyncStorage; it is moved
// over the first time it is read, so nobody gets signed out by the update.
const TOKEN_KEY        = 'maxseat_token';     // encrypted storage
const OLD_TOKEN_KEY    = '@maxseat_token';    // where older versions kept it
let   memToken         = null;                // read storage once, not on every request
let   secureOk         = null;

async function canUseSecure() {
  if (secureOk === null) {
    try { secureOk = await SecureStore.isAvailableAsync(); } catch (_) { secureOk = false; }
  }
  return secureOk;
}

async function readToken() {
  if (memToken) return memToken;
  try {
    if (await canUseSecure()) {
      memToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!memToken) {
        const old = await AsyncStorage.getItem(OLD_TOKEN_KEY);
        if (old) {
          await SecureStore.setItemAsync(TOKEN_KEY, old);
          await AsyncStorage.removeItem(OLD_TOKEN_KEY);
          memToken = old;
        }
      }
    } else {
      memToken = await AsyncStorage.getItem(OLD_TOKEN_KEY);   // web preview has no encrypted storage
    }
  } catch (_) { memToken = null; }
  return memToken;
}

// ─── AXIOS INSTANCE ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,   // Vercel + Neon can take a few seconds to wake up after being idle
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── SESSION EXPIRED ──────────────────────────────────────────────────────────
// Any "401 Unauthorized" outside sign-in/sign-out means the saved login is no
// longer valid. AuthContext registers one handler that signs the user out
// once, so screens don't each need their own "session expired" pop-up.
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error?.config?.url || '';
    if (error?.response?.status === 401 && onUnauthorized && !/\/(login|register|logout)$/.test(url)) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

// ─── TOKEN HELPERS ────────────────────────────────────────────────────────────
export const saveToken = async (token) => {
  memToken = token;
  if (await canUseSecure()) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await AsyncStorage.setItem(OLD_TOKEN_KEY, token);
};
export const clearToken = async () => {
  memToken = null;
  try { if (await canUseSecure()) await SecureStore.deleteItemAsync(TOKEN_KEY); } catch (_) {}
  await AsyncStorage.removeItem(OLD_TOKEN_KEY).catch(() => {});
};
export const getToken = () => readToken();

// ─── ENFORCER AUTH ────────────────────────────────────────────────────────────
export const loginEnforcer = async (username, password) => {
  const res = await api.post('/api/mobile/login', { username, password });
  return res.data;
};

export const logoutEnforcer = async () => {
  try { await api.post('/api/mobile/logout'); } catch (_) {}
  await clearToken();
};

// ─── ENFORCER DISPATCH ────────────────────────────────────────────────────────
export const fetchDispatchOrders = async () => {
  const res = await api.get('/api/mobile/dispatch');
  return res.data;
};

export const submitInterception = async (plate, action, notes) => {
  const res = await api.post('/api/mobile/intercept', { plate, action, notes });
  return res.data;
};

// ─── PASSENGER AUTH ───────────────────────────────────────────────────────────
export const registerPassenger = async ({ username, password, full_name, mobile }) => {
  const res = await api.post('/api/passenger/register', { username, password, full_name, mobile });
  return res.data;
};

export const loginPassenger = async (username, password) => {
  const res = await api.post('/api/passenger/login', { username, password });
  return res.data;
};

export const logoutPassenger = async () => {
  try { await api.post('/api/passenger/logout'); } catch (_) {}
  await clearToken();
};

// ─── PASSENGER PUV DATA ───────────────────────────────────────────────────────
export const fetchAllPuvs = () =>
  api.get('/api/passenger/puvs').then(r => r.data);

export const fetchPuvDetail = (plate) =>
  api.get(`/api/passenger/puv/${encodeURIComponent(plate)}`).then(r => r.data);

// ─── PASSENGER COMPLAINTS ─────────────────────────────────────────────────────
export const submitComplaint = (plate, complaint, description) =>
  api.post('/api/passenger/complaint', { plate, complaint, description }).then(r => r.data);

export const fetchMyComplaints = () =>
  api.get('/api/passenger/my-complaints').then(r => r.data);

// ─── PASSENGER PROFILE ───────────────────────────────────────────────────────
export const updatePassengerProfile = (data) =>
  api.put('/api/passenger/profile', data).then(r => r.data);

export const changePassengerPassword = (data) =>
  api.put('/api/passenger/change-password', data).then(r => r.data);

export default api;
