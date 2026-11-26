import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, RefreshControl,
} from 'react-native';
import { fetchPuvDetail } from '../../api/apiService';
import CapacityMeter from '../../components/CapacityMeter';
import TempCard from '../../components/TempCard';
import ErrorBanner from '../../components/ErrorBanner';
import LiveStamp from '../../components/LiveStamp';
import useLiveData from '../../hooks/useLiveData';
import Icon from '../../components/Icon';
import { GradientFill } from '../../components/Gradient';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS, themed } from '../../theme';

const T = ROLE.passenger;
const show = (v) => (v == null || v === '' ? '—' : String(v));

export default function PuvDetailScreen({ route, navigation }) {
  const { plate, preview } = route.params;

  // Opens instantly with the card's numbers from the list (preview), then
  // fills in the rest and keeps refreshing every 10 s while you look at it.
  const fetcher = useCallback(() => fetchPuvDetail(plate), [plate]);
  const live    = useLiveData(fetcher, { interval: 10000, initial: preview || null });
  const puv     = live.data;
  const notFound = live.error?.response?.status === 404;

  // Header is always there, even before the first answer
  const header = (
    <View style={styles.header}>
      <GradientFill name="brand" glow />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="chevron-back" size={22} color={COLORS.textOnDark} />
      </TouchableOpacity>
      <View style={styles.headerText}>
        <Text style={styles.headerPlate}>{puv?.plate || plate}</Text>
        {puv ? (
          <Text style={styles.headerSub}>{puv.company} · {puv.route}</Text>
        ) : null}
        <LiveStamp updatedAt={live.updatedAt} busy={live.busy} error={live.error} onDark style={{ marginTop: 4 }} />
      </View>
      {puv && (puv.overloaded || puv.hot) && (
        <View style={styles.criticalPill}>
          <Text style={styles.criticalText}>ALERT</Text>
        </View>
      )}
    </View>
  );

  if (!puv) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
        {header}
        <View style={styles.splash}>
          {notFound ? (
            <>
              <Text style={styles.splashTitle}>PUV not found</Text>
              <Text style={styles.splashText}>{plate} isn't on the route right now.</Text>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: T.primary }]} onPress={() => navigation.goBack()}>
                <Text style={styles.smallBtnText}>Go back</Text>
              </TouchableOpacity>
            </>
          ) : live.error ? (
            <ErrorBanner error={live.error} onRetry={live.reload} busy={live.busy} style={{ alignSelf: 'stretch' }} />
          ) : (
            <Text style={[styles.splashText, { color: T.accent }]}>Loading {plate}…</Text>
          )}
        </View>
      </View>
    );
  }

  const over = Math.max(0, puv.passengers - puv.capacity);
  const free = Math.max(0, puv.capacity - puv.passengers);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      {header}

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={live.refreshing} onRefresh={live.refresh} tintColor={T.primary} colors={[T.primary]} />}
      >
        {live.error && !notFound && (
          <ErrorBanner error={live.error} onRetry={live.reload} busy={live.busy} style={{ marginBottom: 14 }} />
        )}

        {/* CAPACITY */}
        <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
          <View style={[styles.cardLabel, { backgroundColor: T.primaryLight }]}>
            <Text style={[styles.sectionLabel, { color: T.accent }]}>Passenger Load</Text>
          </View>
          <View style={{ padding: 18 }}>
            <CapacityMeter passengers={puv.passengers} capacity={puv.capacity} loadPct={puv.load_pct} />
          </View>
        </View>

        {/* TEMPERATURE */}
        <TempCard temp={puv.temp} hot={puv.hot} />

        {/* VEHICLE INFO */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Vehicle Info</Text>
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
                <Text style={styles.infoValue} numberOfLines={2}>{show(value)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* STATUS */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Live Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: puv.overloaded ? COLORS.danger : COLORS.success }]} />
            <Text style={styles.statusText}>
              {puv.overloaded
                ? `Overloaded by ${over} passenger${over !== 1 ? 's' : ''}`
                : `Within capacity (${free} seat${free !== 1 ? 's' : ''} available)`}
            </Text>
          </View>
          {puv.hot && (
            <View style={[styles.statusRow, { marginTop: 8 }]}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.statusText}>Cabin temperature elevated ({puv.temp}°C)</Text>
            </View>
          )}
          <Text style={styles.lastUpdate}>Sensor reading: {show(puv.last_update)}</Text>
        </View>

        {/* REPORT BUTTON */}
        <TouchableOpacity
          style={[styles.reportBtn, { backgroundColor: T.primary }]}
          onPress={() => navigation.navigate('Complaint', { plate: puv.plate, puv })}
          activeOpacity={0.85}
        >
            <GradientFill name="button" />
          <Icon name="megaphone-outline" size={19} color="#fff" />
          <Text style={styles.reportText}>Report a Violation</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  root:   { flex: 1, backgroundColor: COLORS.pageBg },
  splash: { flex: 1, backgroundColor: COLORS.pageBg, justifyContent: 'center', alignItems: 'center', padding: 24 },
  splashTitle: { fontSize: 20, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  splashText: { marginTop: 4, marginBottom: 16, fontFamily: 'Outfit_SemiBold', fontWeight: '700', fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },
  smallBtn:     { borderRadius: RADIUS.md, paddingHorizontal: 24, paddingVertical: 10 },
  smallBtnText: { color: '#fff', fontFamily: 'Outfit_SemiBold', fontWeight: '700', fontSize: 15.5 },
  scroll: { padding: 16 },

  header:      { backgroundColor: COLORS.dark, overflow: 'hidden', borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl, paddingTop: 52, paddingBottom: 24, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12},
  backBtn:     { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', justifyContent: 'center', alignItems: 'center' },
  backIcon:    { fontSize: 20, color: COLORS.textOnDark },
  headerText:  { flex: 1 },
  headerPlate: { fontSize: 22, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: COLORS.textOnDark },
  headerSub:   { fontSize: 13.5, color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 2 },
  criticalPill:{ backgroundColor: COLORS.alert, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  criticalText:{ fontSize: 12.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.onAlert },

  card:         { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  cardLabel:    { paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionLabel: { fontSize: 15.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', padding: 18, paddingBottom: 0 },

  infoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 18, paddingTop: 14 },
  infoItem:  { width: '47%', backgroundColor: T.primaryLight, borderRadius: RADIUS.sm, padding: 11, borderWidth: 1, borderColor: T.primaryMid },
  infoLabel: { fontSize: 12, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 },
  infoValue: { fontSize: 14.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 14 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText:{ fontSize: 14.5, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600', flex: 1 },
  lastUpdate:{ fontSize: 12.5, color: COLORS.textMuted, marginTop: 12, fontFamily: 'Outfit_Regular', fontWeight: '500', paddingHorizontal: 18, paddingBottom: 18 },

  reportBtn:  { borderRadius: RADIUS.lg, height: 56, flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6, ...SHADOW.button, shadowColor: T.primary , overflow: 'hidden' },
  reportText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },
}));
