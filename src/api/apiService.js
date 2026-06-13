import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
export const BASE_URL = 'https://web-production-ab4a.up.railway.app';

const TOKEN_KEY = '@maxseat_token';

// ─── AXIOS INSTANCE ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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
