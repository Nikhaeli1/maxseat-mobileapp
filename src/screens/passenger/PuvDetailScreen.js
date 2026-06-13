import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, StatusBar, RefreshControl,
} from 'react-native';
import { fetchPuvDetail } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import CapacityMeter from '../../components/CapacityMeter';
import TempCard from '../../components/TempCard';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS} from '../../theme';

const T = ROLE.passenger;

export default function PuvDetailScreen({ route, navigation }) {
  const { plate }         = route.params;
  const { logout }        = useAuth();
  const [puv, setPuv]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await fetchPuvDetail(plate);
      setPuv(data);
    } catch (err) {
      if (err?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [{ text: 'OK', onPress: logout }]);
      } else if (err?.response?.status === 404) {
        Alert.alert('Not Found', `PUV "${plate}" not found.`, [{ text: 'Go Back', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('Error', 'Could not load PUV details.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [plate, logout, navigation]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={T.primary} />
        <Text style={[styles.splashText, { color: T.primary }]}>Loading {plate}…</Text>
      </View>
    );
  }

  if (!puv) return null;

  const isCritical = puv.overloaded || puv.hot;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerPlate}>{puv.plate}</Text>
          <Text style={styles.headerSub}>{puv.company} · {puv.route}</Text>
        </View>
        {isCritical && (
          <View style={styles.criticalPill}>
            <Text style={styles.criticalText}>⚠ ALERT</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.primary} />}
      >
        {/* CAPACITY */}
        <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
          <View style={[styles.cardLabel, { backgroundColor: T.primaryLight }]}>
            <Text style={[styles.sectionLabel, { color: T.primary }]}>👥 Passenger Load</Text>
          </View>
          <View style={{ padding: 18 }}>
            <CapacityMeter passengers={puv.passengers} capacity={puv.capacity} loadPct={puv.load_pct} />
          </View>
        </View>

        {/* TEMPERATURE */}
        <TempCard temp={puv.temp} hot={puv.hot} />

        {/* VEHICLE INFO */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>🚌 Vehicle Info</Text>
          <View style={styles.infoGrid}>
            {[
              ['Plate',    puv.plate],
              ['Driver',   puv.driver],
              ['Route',    puv.route],
              ['Schedule', puv.schedule],
              ['Speed',    puv.speed],
              ['Location', puv.loc_name],
            ].map(([label, value]) => (
              <View key={label} style={styles.infoItem}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* STATUS */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>📡 Live Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: puv.overloaded ? COLORS.danger : '#22c55e' }]} />
            <Text style={styles.statusText}>
              {puv.overloaded
                ? `Overloaded by ${puv.passengers - puv.capacity} passenger${puv.passengers - puv.capacity !== 1 ? 's' : ''}`
                : `Within capacity (${puv.capacity - puv.passengers} seat${puv.capacity - puv.passengers !== 1 ? 's' : ''} available)`}
            </Text>
          </View>
          {puv.hot && (
            <View style={[styles.statusRow, { marginTop: 8 }]}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.statusText}>Cabin temperature elevated ({puv.temp}°C)</Text>
            </View>
          )}
          <Text style={styles.lastUpdate}>Last updated: {puv.last_update}</Text>
        </View>

        {/* REPORT BUTTON */}
        <TouchableOpacity
          style={[styles.reportBtn, { backgroundColor: T.primary }]}
          onPress={() => navigation.navigate('Complaint', { plate: puv.plate, puv })}
          activeOpacity={0.85}
        >
          <Text style={styles.reportText}>📢  Report a Violation</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.pageBg },
  splash: { flex: 1, backgroundColor: COLORS.pageBg, justifyContent: 'center', alignItems: 'center' },
  splashText: { marginTop: 12, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', fontSize: 15 },
  scroll: { padding: 16 },

  header:      { backgroundColor: COLORS.dark, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 3, borderBottomColor: T.primary },
  backBtn:     { width: 38, height: 38, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  backIcon:    { fontSize: 20, color: COLORS.textOnDark },
  headerText:  { flex: 1 },
  headerPlate: { fontSize: 22, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', color: COLORS.textOnDark },
  headerSub:   { fontSize: 12, color: T.primaryMid, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', marginTop: 2 },
  criticalPill:{ backgroundColor: 'rgba(220,38,38,0.15)', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(220,38,38,0.4)' },
  criticalText:{ fontSize: 11, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.danger },

  card:         { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  cardLabel:    { paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.9, padding: 18, paddingBottom: 0 },

  infoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 18, paddingTop: 14 },
  infoItem:  { width: '47%', backgroundColor: T.primaryLight, borderRadius: RADIUS.sm, padding: 11, borderWidth: 1, borderColor: T.primaryMid },
  infoLabel: { fontSize: 10, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: COLORS.textMuted, marginBottom: 4 },
  infoValue: { fontSize: 13, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 14 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText:{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', flex: 1 },
  lastUpdate:{ fontSize: 11, color: COLORS.textMuted, marginTop: 12, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500', paddingHorizontal: 18, paddingBottom: 18 },

  reportBtn:  { borderRadius: RADIUS.lg, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 6, ...SHADOW.button, shadowColor: T.primary },
  reportText: { color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },
});
