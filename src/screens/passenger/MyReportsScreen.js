import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyComplaints } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import AnimatedListItem from '../../components/AnimatedListItem';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS} from '../../theme';

const T = ROLE.passenger;

const TYPE_CONFIG = {
  overload: { icon: '👥', label: 'Passenger Overloading', color: COLORS.danger,  bg: COLORS.dangerLight },
  thermal:  { icon: '🌡', label: 'Elevated Temperature',  color: COLORS.warning, bg: '#fef3c7' },
  other:    { icon: '⚠',  label: 'Other Violation',       color: COLORS.textSecondary, bg: COLORS.pageBg },
};

const STATUS_CONFIG = {
  open:   { color: T.primary, bg: T.primaryLight, label: 'OPEN' },
  closed: { color: '#16a34a', bg: '#dcfce7',      label: 'RESOLVED' },
};

export default function MyReportsScreen() {
  const { user }                     = useAuth();
  const [complaints, setComplaints]  = useState([]);
  const [loading,    setLoading]     = useState(true);
  const [refreshing, setRefreshing]  = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await fetchMyComplaints();
      setComplaints(data.complaints || []);
    } catch (err) {
      Alert.alert('Error', 'Could not load your reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCount   = complaints.filter(c => c.status === 'open').length;
  const closedCount = complaints.filter(c => c.status !== 'open').length;

  const renderItem = ({ item }) => {
    const tc = TYPE_CONFIG[item.complaint] || TYPE_CONFIG.other;
    const sc = STATUS_CONFIG[item.status]  || STATUS_CONFIG.open;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: tc.bg }]}>
            <Text style={{ fontSize: 20 }}>{tc.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.typeName}>{tc.label}</Text>
            <Text style={styles.serial}>{item.serial}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          {[
            ['Plate', item.plate],
            ['Date',  item.timestamp ? item.timestamp.split('T')[0] : '—'],
            ['Pax',   item.passengers != null ? `${item.passengers}/${item.capacity}` : '—'],
            ['Temp',  item.temp != null ? `${item.temp}°C` : '—'],
          ].map(([label, value]) => (
            <View key={label} style={styles.infoItem}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        {item.description ? (
          <View style={[styles.descBox, { backgroundColor: T.primaryLight }]}>
            <Text style={[styles.descText, { color: T.primaryDark }]}>"{item.description}"</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />

      <View style={styles.header}>
        <Logo size="header" style={{ marginBottom: 10 }} />
        <View style={styles.passengerPill}>
          <Text style={styles.passengerPillText}>PASSENGER</Text>
        </View>
        <Text style={styles.title}>My Reports</Text>
        <Text style={styles.sub}>{user?.full_name}</Text>
      </View>

      {/* STATS */}
      <View style={styles.statRow}>
        {[
          { value: complaints.length, label: 'Total',    color: COLORS.textPrimary },
          { value: openCount,         label: 'Open',     color: T.primary },
          { value: closedCount,       label: 'Resolved', color: '#22c55e' },
        ].map(({ value, label, color }, i) => (
          <View key={label} style={[styles.statCard, i > 0 && styles.statCardBorder]}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={T.primary} />
          <Text style={[styles.loadingText, { color: T.primary }]}>Loading your reports…</Text>
        </View>
      )}

      {!loading && complaints.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📢</Text>
          <Text style={styles.emptyTitle}>No Reports Yet</Text>
          <Text style={styles.emptySub}>Violation reports you submit will appear here.</Text>
        </View>
      )}

      {!loading && complaints.length > 0 && (
        <FlatList
          data={complaints}
          keyExtractor={(item, i) => `${item.serial}-${i}`}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.primary} />}
          ListHeaderComponent={
            <Text style={styles.listHeader}>{complaints.length} report{complaints.length !== 1 ? 's' : ''} submitted</Text>
          }
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              {renderItem({ item, index })}
            </AnimatedListItem>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.pageBg },

  header: { backgroundColor: COLORS.cardBg, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  passengerPill: { backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: RADIUS.badge, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(37,99,235,0.25)', alignSelf: 'flex-start', marginBottom: 8 },
  passengerPillText: { fontSize: 10, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: T.primary, letterSpacing: 0.5 },
  title: { fontSize: 22, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.3 },
  sub:   { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', marginTop: 3 },

  statRow:       { backgroundColor: COLORS.cardBg, flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statCard:      { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statCardBorder:{ borderLeftWidth: 1, borderLeftColor: COLORS.border },
  statValue:     { fontSize: 24, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', color: COLORS.textPrimary },
  statLabel:     { fontSize: 10, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600' },
  emptyIcon:   { fontSize: 52, marginBottom: 12 },
  emptyTitle:  { fontSize: 18, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  emptySub:    { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },

  list:       { padding: 16 },
  listHeader: { fontSize: 11, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  card:       { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  typeIcon:   { width: 46, height: 46, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  typeName:   { fontSize: 13, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },
  serial:     { fontSize: 11, color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', marginTop: 2 },
  statusBadge:{ borderRadius: RADIUS.badge, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },
  divider:    { height: 1, backgroundColor: COLORS.borderLight, marginBottom: 12 },

  infoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoItem:  { width: '47%', backgroundColor: COLORS.pageBg, borderRadius: RADIUS.sm, padding: 10, borderWidth: 1, borderColor: COLORS.border },
  infoLabel: { fontSize: 9, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: COLORS.textMuted, marginBottom: 3 },
  infoValue: { fontSize: 13, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },

  descBox:  { marginTop: 10, borderRadius: RADIUS.sm, padding: 10 },
  descText: { fontSize: 12, fontStyle: 'italic', lineHeight: 17 },
});
