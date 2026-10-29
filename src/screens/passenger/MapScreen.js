import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import LeafletMap from '../../components/LeafletMap';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchAllPuvs } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import { COLORS, ROLE, RADIUS , FONTS} from '../../theme';

const T = ROLE.passenger;

export default function MapScreen() {
  const navigation          = useNavigation();
  const { logout }          = useAuth();
  const [puvs, setPuvs]     = useState([]);
  const [loading, setLoading] = useState(true);

  const markerColor = (p) => p.overloaded ? COLORS.danger : p.load_pct >= 80 ? COLORS.warning : '#22c55e';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllPuvs();
      const list = data.puvs || [];
      setPuvs(list);   // the map zooms to the vehicles by itself
    } catch (err) {
      if (err?.response?.status === 401)
        Alert.alert('Session Expired', 'Please log in again.', [{ text: 'OK', onPress: logout }]);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const overloaded = puvs.filter(p => p.overloaded).length;

  const markers = useMemo(() => puvs.map(item => ({
    id:     item.puv_id,
    lat:    item.lat,
    lng:    item.lng,
    hasGps: item.has_gps,
    color:  markerColor(item),
    title:  item.plate,
    lines:  [
      item.company,
      `📍 ${item.loc_name || '—'}`,
      { text: `👥 ${item.passengers}/${item.capacity}`, tone: item.overloaded ? 'bad' : '' },
      { text: `🌡 ${item.temp}°C`, tone: item.hot ? 'warn' : '' },
    ],
    cta:    'View details →',
  })), [puvs]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PUV Live Map</Text>
          <Text style={styles.sub}>Bugo–Igpit · Real-time</Text>
        </View>
        <TouchableOpacity style={styles.reloadBtn} onPress={load}>
          <Text style={[styles.reloadIcon, { color: T.primary }]}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* LEGEND */}
      <View style={styles.legend}>
        {[
          { color: '#22c55e', label: 'Available' },
          { color: COLORS.warning, label: 'Nearly Full' },
          { color: COLORS.danger,  label: 'Overloaded' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
        {overloaded > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertText}>⚠ {overloaded}</Text>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={T.primary} />
          <Text style={styles.loadingText}>Loading PUV locations…</Text>
        </View>
      )}

      <LeafletMap
        style={styles.map}
        markers={markers}
        showLocate
        onMarkerPress={(id) => {
          const item = puvs.find(p => String(p.puv_id) === String(id));
          if (item) navigation.navigate('PuvDetail', { plate: item.plate });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cardBg },
  map:  { flex: 1 },

  header:    { backgroundColor: COLORS.cardBg, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:     { fontSize: 20, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', color: COLORS.textPrimary },
  sub:       { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', marginTop: 1 },
  reloadBtn: { width: 38, height: 38, borderRadius: RADIUS.sm, backgroundColor: COLORS.pageBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  reloadIcon:{ fontSize: 20, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },

  legend:     { backgroundColor: COLORS.cardBg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600' },
  alertBadge: { marginLeft: 'auto', backgroundColor: COLORS.danger, borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3 },
  alertText:  { color: '#fff', fontSize: 11, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  loadingText:    { color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', marginTop: 10 },

  callout:        { width: 220, padding: 6 },
  calloutPlate:   { fontSize: 17, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', color: COLORS.textPrimary, marginBottom: 2 },
  calloutCompany: { fontSize: 12, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600' },
  calloutLoc:     { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, marginBottom: 8 },
  calloutStats:   { flexDirection: 'row', gap: 6, marginBottom: 8 },
  statChip:       { borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  statChipText:   { fontSize: 11, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700' },
  calloutCta:     { fontSize: 12, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: T.primary, textAlign: 'right' },
});
