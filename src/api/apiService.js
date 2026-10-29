import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Server address (Vercel). To point the app somewhere else without editing code,
// set EXPO_PUBLIC_API_URL in a .env file, e.g. EXPO_PUBLIC_API_URL=http://192.168.1.5:8000
export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://maxseat-final.vercel.app').replace(/\/+$/, '');

// CARTO map style key (optional). Put EXPO_PUBLIC_CARTO_KEY=... in a .env file.
// Without it, maps use free OpenStreetMap tiles.
export const CARTO_KEY = (process.env.EXPO_PUBLIC_CARTO_KEY || '').trim();

const TOKEN_KEY = '@maxseat_token';

// ─── AXIOS INSTANCE ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,   // Vercel + Neon can take a few seconds to wake up after being idle
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── TOKEN HELPERS ────────────────────────────────────────────────────────────
export const saveToken  = (token) => AsyncStorage.setItem(TOKEN_KEY, token);
export const clearToken = ()      => AsyncStorage.removeItem(TOKEN_KEY);
export const getToken   = ()      => AsyncStorage.getItem(TOKEN_KEY);

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
