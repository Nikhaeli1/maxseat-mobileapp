import React, { useMemo, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useScrollToTop, useNavigation } from '@react-navigation/native';
import { fetchMyComplaints } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import AnimatedListItem from '../../components/AnimatedListItem';
import SkeletonList from '../../components/Skeleton';
import ErrorBanner from '../../components/ErrorBanner';
import LiveStamp from '../../components/LiveStamp';
import useLiveData from '../../hooks/useLiveData';
import Icon from '../../components/Icon';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS} from '../../theme';

const T = ROLE.passenger;

const TYPE_CONFIG = {
  overload: { icon: 'people-outline', label: 'Passenger Overloading', color: COLORS.danger,  bg: COLORS.dangerLight },
  thermal:  { icon: 'thermometer-outline', label: 'Elevated Temperature',  color: COLORS.warning, bg: COLORS.warningBg },
  other:    { icon: 'alert-circle-outline', label: 'Other Violation',       color: COLORS.textSecondary, bg: COLORS.pageBg },
};

const STATUS_CONFIG = {
  open:   { color: T.primary, bg: T.primaryLight, label: 'OPEN' },
  closed: { color: COLORS.success, bg: COLORS.successBg,      label: 'RESOLVED' },
};

export default function MyReportsScreen() {
  const { user }   = useAuth();
  const navigation = useNavigation();

  // Refreshes on focus (so a new report shows right away) and every 30 s
  const live       = useLiveData(fetchMyComplaints, { interval: 30000 });
  const complaints = useMemo(() => live.data?.complaints || [], [live.data]);
  const loading    = live.loading;

  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const openCount   = complaints.filter(c => c.status === 'open').length;
  const closedCount = complaints.filter(c => c.status !== 'open').length;

  const renderItem = ({ item }) => {
    const tc = TYPE_CONFIG[item.complaint] || TYPE_CONFIG.other;
    const sc = STATUS_CONFIG[item.status]  || STATUS_CONFIG.open;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: tc.bg }]}>
            <Icon name={tc.icon} size={22} color={tc.color} />
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
            ['Sent',  item.timestamp ? item.timestamp.replace('T', ' ').slice(0, 16) : '—'],
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
      <StatusBar barStyle={COLORS.statusBar} backgroundColor={COLORS.cardBg} />

      <View style={styles.header}>
        <Logo size="header" style={{ marginBottom: 10 }} />
        <View style={styles.passengerPill}>
          <Text style={styles.passengerPillText}>PASSENGER</Text>
        </View>
        <Text style={styles.title}>My Reports</Text>
        <Text style={styles.sub}>{user?.full_name}</Text>
        <LiveStamp updatedAt={live.updatedAt} busy={live.busy} error={live.error} style={{ marginTop: 6 }} />
      </View>

      {/* STATS */}
      <View style={styles.statRow}>
        {[
          { value: complaints.length, label: 'Total',    color: COLORS.textPrimary },
          { value: openCount,         label: 'Open',     color: T.primary },
          { value: closedCount,       label: 'Resolved', color: COLORS.success },
        ].map(({ value, label, color }, i) => (
          <View key={label} style={[styles.statCard, i > 0 && styles.statCardBorder]}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {live.error && !loading && (
        <ErrorBanner error={live.error} onRetry={live.reload} busy={live.busy} style={{ marginHorizontal: 16, marginTop: 12 }} />
      )}

      {loading && <SkeletonList count={2} variant="report" />}

      {!loading && complaints.length === 0 && !live.error && (
        <View style={styles.centered}>
          <Icon name="megaphone-outline" size={48} color={COLORS.textMuted} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Reports Yet</Text>
          <Text style={styles.emptySub}>See a PUV breaking the rules? Open it from the PUVs tab and tap “Report a Violation”.</Text>
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: T.primary }]} onPress={() => navigation.navigate('PUVs')}>
            <Text style={styles.emptyBtnText}>Go to PUVs</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && complaints.length > 0 && (
        <FlatList
          ref={scrollRef}
          data={complaints}
          keyExtractor={(item, i) => `${item.serial}-${i}`}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={live.refreshing} onRefresh={live.refresh} tintColor={T.primary} colors={[T.primary]} />}
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
  passengerPill: { backgroundColor: 'rgba(47,111,90,0.1)', borderRadius: RADIUS.badge, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(47,111,90,0.25)', alignSelf: 'flex-start', marginBottom: 8 },
  passengerPillText: { fontSize: 10, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: T.primary, letterSpacing: 0.5 },
  title: { fontSize: 22, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.3 },
  sub:   { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 3 },

  statRow:       { backgroundColor: COLORS.cardBg, flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statCard:      { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statCardBorder:{ borderLeftWidth: 1, borderLeftColor: COLORS.border },
  statValue:     { fontSize: 24, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: COLORS.textPrimary },
  statLabel:     { fontSize: 10, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontFamily: 'Outfit_SemiBold', fontWeight: '600' },
  emptyIcon:   { marginBottom: 12 },
  emptyTitle:  { fontSize: 18, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  emptySub:    { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  emptyBtn:     { borderRadius: RADIUS.md, paddingHorizontal: 24, paddingVertical: 10 },
  emptyBtnText: { color: '#fff', fontFamily: 'Outfit_SemiBold', fontWeight: '700', fontSize: 14 },

  list:       { padding: 16 },
  listHeader: { fontSize: 11, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  card:       { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  typeIcon:   { width: 46, height: 46, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  typeName:   { fontSize: 13, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },
  serial:     { fontSize: 11, color: COLORS.textMuted, fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 2 },
  statusBadge:{ borderRadius: RADIUS.badge, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },
  divider:    { height: 1, backgroundColor: COLORS.borderLight, marginBottom: 12 },

  infoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoItem:  { width: '47%', backgroundColor: COLORS.pageBg, borderRadius: RADIUS.sm, padding: 10, borderWidth: 1, borderColor: COLORS.border },
  infoLabel: { fontSize: 9, fontFamily: 'Outfit_SemiBold', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: COLORS.textMuted, marginBottom: 3 },
  infoValue: { fontSize: 13, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },

  descBox:  { marginTop: 10, borderRadius: RADIUS.sm, padding: 10 },
  descText: { fontSize: 12, fontStyle: 'italic', lineHeight: 17 },
});
