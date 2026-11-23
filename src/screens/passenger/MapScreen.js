import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import LeafletMap from '../../components/LeafletMap';
import { useNavigation } from '@react-navigation/native';
import { fetchAllPuvs } from '../../api/apiService';
import LiveStamp from '../../components/LiveStamp';
import ErrorBanner from '../../components/ErrorBanner';
import useLiveData from '../../hooks/useLiveData';
import Icon from '../../components/Icon';
import { GradientFill } from '../../components/Gradient';
import { COLORS, ROLE, RADIUS , FONTS, IS_DARK, themed } from '../../theme';

const T = ROLE.passenger;

export default function MapScreen() {
  const navigation = useNavigation();

  // Live: refreshes on focus and every 15 s. Dots move to their new spots
  // without the map resetting your zoom.
  const live    = useLiveData(fetchAllPuvs, { interval: 15000 });
  const puvs    = useMemo(() => live.data?.puvs || [], [live.data]);
  const loading = live.loading;

  // Map dots: calm green when fine, lime when overloaded (the 'look here' color)
  const markerColor = (p) => p.overloaded ? COLORS.alert : p.load_pct >= 80 ? '#DDF79A' : COLORS.primary;

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
      item.loc_name || '—',
      { text: `${item.passengers}/${item.capacity} passengers`, tone: item.overloaded ? 'bad' : '' },
      { text: `${item.temp}°C cabin`, tone: item.hot ? 'warn' : '' },
    ],
    cta:    'View details',
  })), [puvs]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* HEADER */}
      <View style={styles.header}>
        <GradientFill name="brand" glow />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Live map</Text>
          <Text style={styles.sub}>Every jeep on the Bugo to Igpit route</Text>
          <LiveStamp updatedAt={live.updatedAt} busy={live.busy} error={live.error} onDark style={{ marginTop: 6 }} />
        </View>
        <TouchableOpacity style={styles.reloadBtn} onPress={live.reload} disabled={live.busy} accessibilityLabel="Refresh map">
          {live.busy
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Icon name="refresh" size={21} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>

      {/* LEGEND */}
      <View style={styles.legend}>
        {[
          { color: COLORS.primary, label: 'Available' },
          { color: '#DDF79A',      label: 'Nearly Full' },
          { color: COLORS.alert,   label: 'Overloaded' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
        {overloaded > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertText}>{overloaded} overloaded</Text>
          </View>
        )}
      </View>

      <View style={styles.mapArea}>
        <LeafletMap
          style={styles.map}
          markers={markers}
          showLocate
          onMarkerPress={(id) => {
            const item = puvs.find(p => String(p.puv_id) === String(id));
            if (item) navigation.navigate('PuvDetail', { plate: item.plate, preview: item });
          }}
        />

        {live.error && !loading && (
          <View style={styles.bannerWrap} pointerEvents="box-none">
            <ErrorBanner error={live.error} onRetry={live.reload} busy={live.busy} />
          </View>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={T.accent} />
            <Text style={styles.loadingText}>Loading PUV locations…</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = themed(() => ({
  root: { flex: 1, backgroundColor: COLORS.cardBg },
  mapArea: { flex: 1 },
  map:  { flex: 1 },

  header:    { backgroundColor: COLORS.dark, overflow: 'hidden', paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl, zIndex: 2 },
  title:     { fontSize: 26, lineHeight: 32, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4 },
  sub:       { fontSize: 14.5, color: 'rgba(255,255,255,0.82)', fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 2 },
  reloadBtn: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.16)', justifyContent: 'center', alignItems: 'center' },
  reloadIcon:{ fontSize: 20, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },

  legend:     { backgroundColor: COLORS.cardBg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12.5, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600' },
  alertBadge: { marginLeft: 'auto', backgroundColor: COLORS.alert, borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3 },
  alertText:  { color: COLORS.onAlert, fontSize: 12.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: IS_DARK ? 'rgba(27,31,29,0.85)' : 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  bannerWrap:     { position: 'absolute', left: 12, right: 12, bottom: 16, zIndex: 11 },
  loadingText:    { color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '700', marginTop: 10 },

  callout:        { width: 220, padding: 6 },
  calloutPlate:   { fontSize: 17, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: COLORS.textPrimary, marginBottom: 2 },
  calloutCompany: { fontSize: 13.5, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600' },
  calloutLoc:     { fontSize: 13.5, color: COLORS.textSecondary, marginTop: 2, marginBottom: 8 },
  calloutStats:   { flexDirection: 'row', gap: 6, marginBottom: 8 },
  statChip:       { borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  statChipText:   { fontSize: 12.5, fontFamily: 'Outfit_SemiBold', fontWeight: '700' },
  calloutCta:     { fontSize: 13.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: T.accent, textAlign: 'right' },
}));
