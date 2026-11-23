import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, StatusBar, Alert, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LeafletMap from '../../components/LeafletMap';
import { useFocusEffect } from '@react-navigation/native';
import { fetchDispatchOrders } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import ViolationCard from '../../components/ViolationCard';
import AnimatedListItem from '../../components/AnimatedListItem';
import SkeletonList from '../../components/Skeleton';
import ErrorBanner from '../../components/ErrorBanner';
import LiveStamp from '../../components/LiveStamp';
import useLiveData from '../../hooks/useLiveData';
import { useThemeMode } from '../../context/ThemeContext';
import Logo from '../../components/Logo';
import { useTutorial } from '../../context/TutorialContext';
import { GradientFill } from '../../components/Gradient';
import Icon from '../../components/Icon';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS, themed } from '../../theme';

const T = ROLE.enforcer;
const { height: H } = Dimensions.get('window');
const DASH_TUTORIAL_KEY = '@maxseat_dash_tutorial_enforcer_v2';

export default function DispatchScreen({ navigation }) {
  const { user, logout, switchRole } = useAuth();
  const { startTutorial, stopTutorial } = useTutorial();
  const { dark, toggle: toggleTheme } = useThemeMode();
  const [view,       setView]        = useState('list');
  const [mapOpened,  setMapOpened]   = useState(false);   // keep the map alive once opened
  useEffect(() => { if (view === 'map') setMapOpened(true); }, [view]);

  // Live board: refreshes on focus and every 15 s. Critical ones first.
  const live    = useLiveData(fetchDispatchOrders, { interval: 15000 });
  const loading = live.loading;
  const orders  = useMemo(() => {
    const list = [...(live.data?.dispatch_orders || [])];
    const crit = (o) => ((o.violations || []).some(v => v.severity === 'critical') ? 0 : 1);
    return list.map((o, i) => [o, i]).sort((a, b) => crit(a[0]) - crit(b[0]) || a[1] - b[1]).map(([o]) => o);
  }, [live.data]);


  // Refs for coach-mark spotlight
  const topBarRef   = useRef(null);
  const toggleRef   = useRef(null);
  const listRef     = useRef(null);
  const actionsRef  = useRef(null);

  // Tutorial steps — stable identity (they only close over refs)
  const tutorialSteps = useRef([
    {
      targetRef: topBarRef,
      icon: 'shield-checkmark-outline',
      title: 'Your dispatch board',
      desc: 'All active violations on the route. Critical ones are marked in solid lime.',
    },
    {
      targetRef: toggleRef,
      icon: 'map-outline',
      title: 'List or map',
      desc: 'List sorts violations by how serious they are. Map shows every flagged PUV live.',
    },
    {
      targetRef: listRef,
      icon: 'alert-circle-outline',
      title: 'Respond to a violation',
      desc: 'Tap a card to see the live cabin view, then log a warning, ticket or hold.',
    },
    {
      targetRef: actionsRef,
      icon: 'flash-outline',
      title: 'Quick actions',
      desc: 'Replay this tour, switch to Passenger mode, or log out when your shift ends.',
    },
  ]).current;

  const mapMarkers = useMemo(() => orders.map(item => {
    const isCritical = (item.violations || []).some(v => v.severity === 'critical');
    return {
      id:     item.puv_id,
      lat:    item.lat,
      lng:    item.lng,
      hasGps: item.has_gps,
      color:  isCritical ? COLORS.danger : COLORS.warning,
      radius: 12,
      title:  item.plate,
      lines:  [
        item.company,
        item.loc_name || '—',
        ...(item.violations || []).map(v => ({ text: v.label, tone: v.severity === 'critical' ? 'bad' : 'warn' })),
      ],
      cta:    'Respond',
    };
  }), [orders]);

  const handleTutorialDone = useCallback(async () => {
    await AsyncStorage.setItem(DASH_TUTORIAL_KEY, '1');
  }, []);

  const launchTutorial = useCallback(() => {
    startTutorial(tutorialSteps, {
      accentColor: T.primary,
      onDone: handleTutorialDone,
    });
  }, [startTutorial, tutorialSteps, handleTutorialDone]);

  // Show tutorial on first visit. Delayed so the list paints before measuring.
  useFocusEffect(useCallback(() => {
    let timer;
    let cancelled = false;
    (async () => {
      const seen = await AsyncStorage.getItem(DASH_TUTORIAL_KEY);
      if (!seen && !cancelled) timer = setTimeout(launchTutorial, 450);
    })();
    // Leaving this screen: cancel a pending start and close any tour still open
    return () => { cancelled = true; clearTimeout(timer); stopTutorial(); };
  }, [launchTutorial, stopTutorial]));

  const handleLogout = () =>
    Alert.alert('End Shift', 'Log out of enforcer session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);

  const handleSwitchRole = () =>
    Alert.alert('Switch to Passenger Mode', 'This will end your enforcer session.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Switch', onPress: () => switchRole('passenger') },
    ]);

  const criticalCount = orders.filter(o => (o.violations || []).some(v => v.severity === 'critical')).length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* ── TOP BAR (gradient hero) ───────────────────────────────────── */}
      <View ref={topBarRef} style={styles.topBar}>
        <GradientFill name="brand" glow />
        <View style={styles.topRow}>
          <Logo size="header" onDark />
          <View ref={actionsRef} style={styles.topActions}>
            {[
              { icon: 'help-circle-outline', label: 'Tutorial', onPress: launchTutorial },
              { icon: 'swap-horizontal', label: 'Passenger', onPress: handleSwitchRole },
              { icon: dark ? 'sunny-outline' : 'moon-outline', label: dark ? 'Light' : 'Dark', onPress: toggleTheme },
              { icon: 'log-out-outline', label: 'Log out', onPress: handleLogout, lime: true },
            ].map((b) => (
              <TouchableOpacity
                key={b.label}
                onPress={b.onPress}
                style={[styles.iconBtn, b.lime && styles.logoutBtn]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={b.label}
              >
                <Icon name={b.icon} size={19} color={b.lime ? COLORS.onAlert : '#FFFFFF'} />
                <Text style={[styles.iconBtnText, b.lime && { color: COLORS.onAlert }]}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.enforcerPill}>
            <Icon name="shield-checkmark" size={13} color="#FFFFFF" />
            <Text style={styles.enforcerPillText}>Enforcer</Text>
          </View>
          {criticalCount > 0 && (
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalBadgeText}>{criticalCount} critical</Text>
            </View>
          )}
          {orders.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{orders.length} open</Text>
            </View>
          )}
        </View>
        <Text style={styles.topTitle}>Dispatch orders</Text>
        <Text style={styles.topSub}>
          {user?.full_name} · {user?.badge || user?.username}
        </Text>
        <LiveStamp updatedAt={live.updatedAt} busy={live.busy} error={live.error} onDark style={{ marginTop: 6 }} />
      </View>

      {/* ── VIEW TOGGLE ─────────────────────────────────────────────────── */}
      <View ref={toggleRef} style={styles.toggleRow}>
        {[
          { key: 'list', label: 'List' },
          { key: 'map',  label: 'Map'  },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.toggleBtn, view === key && styles.toggleBtnActive]}
            onPress={() => setView(key)}
          >
            <Text style={[styles.toggleText, view === key && styles.toggleTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CONTENT AREA — wrapped in listRef for tutorial spotlight ──── */}
      <View ref={listRef} style={{ flex: 1 }}>
        {live.error && !loading && (
          <ErrorBanner error={live.error} onRetry={live.reload} busy={live.busy} style={styles.banner} />
        )}

        <View style={{ flex: 1 }}>
          {/* ── LIST VIEW ─────────────────────────────────────────────────── */}
          <View style={[StyleSheet.absoluteFill, view !== 'list' && styles.hidden]} pointerEvents={view === 'list' ? 'auto' : 'none'}>
            {loading && <SkeletonList count={3} variant="order" />}

            {!loading && orders.length === 0 && (
              <View style={styles.centered}>
                <Text style={styles.emptyTitle}>{live.error ? "Can't load orders" : 'All Clear'}</Text>
                <Text style={styles.emptySub}>
                  {live.error ? 'Check your connection, then refresh.' : 'No active violations at this time.'}
                </Text>
                <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: T.primary }]} onPress={live.refresh}>
                  <Text style={styles.refreshBtnText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && orders.length > 0 && (
              <FlatList
                data={orders}
                keyExtractor={item => String(item.puv_id)}
                contentContainerStyle={styles.list}
                refreshControl={
                  <RefreshControl refreshing={live.refreshing} onRefresh={live.refresh} tintColor={T.primary} colors={[T.primary]} />
                }
                renderItem={({ item, index }) => (
                  <AnimatedListItem index={index}>
                    <ViolationCard
                      order={item}
                      onPress={() => navigation.navigate('Action', { order: item })}
                    />
                  </AnimatedListItem>
                )}
                ListHeaderComponent={
                  <Text style={styles.listHeader}>
                    {orders.length} active violation{orders.length !== 1 ? 's' : ''} · Bugo–Igpit Corridor
                  </Text>
                }
              />
            )}
          </View>

          {/* ── MAP VIEW: built the first time you open it, then kept, so
                 switching List ⇄ Map is instant and keeps your zoom ──────── */}
          {mapOpened && (
            <View style={[StyleSheet.absoluteFill, view !== 'map' && styles.hidden]} pointerEvents={view === 'map' ? 'auto' : 'none'}>
              <LeafletMap
                style={styles.map}
                markers={mapMarkers}
                onMarkerPress={(id) => {
                  const item = orders.find(o => String(o.puv_id) === String(id));
                  if (item) navigation.navigate('Action', { order: item });
                }}
              />
            </View>
          )}
        </View>
      </View>

    </View>
  );
}

const styles = themed(() => ({
  root: { flex: 1, backgroundColor: COLORS.pageBg },

  topBar: {
    backgroundColor:  COLORS.dark,
    overflow:         'hidden',
    paddingTop:       52,
    paddingBottom:    22,
    paddingHorizontal:20,
    borderBottomLeftRadius:  RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badgeRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  enforcerPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: RADIUS.full, paddingHorizontal: 11, paddingVertical: 5 },
  enforcerPillText: { fontSize: 13, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: '#FFFFFF' },
  criticalBadge: { backgroundColor: COLORS.alert, borderRadius: RADIUS.full, paddingHorizontal: 11, paddingVertical: 5 },
  criticalBadgeText: { fontSize: 13, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.onAlert },

  topTitle:   { fontSize: 26, lineHeight: 32, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4 },
  topSub:     { fontSize: 14.5, color: 'rgba(255,255,255,0.82)', fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 3 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countBadge: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: RADIUS.full, paddingHorizontal: 11, paddingVertical: 5 },
  countText:  { color: '#fff', fontSize: 13, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },
  iconBtn:     { width: 56, paddingVertical: 7, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', justifyContent: 'center', alignItems: 'center', gap: 2 },
  logoutBtn:   { backgroundColor: COLORS.alert },
  iconBtnText: { fontSize: 11, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: '#FFFFFF' },

  toggleRow:       { flexDirection: 'row', backgroundColor: COLORS.cardBg, marginHorizontal: 16, marginTop: 14, marginBottom: 4, padding: 4, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.sm },
  toggleBtn:       { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: RADIUS.md - 4 },
  toggleBtnActive: { backgroundColor: COLORS.primary },
  toggleText:      { fontSize: 15.5, fontFamily: 'Outfit_SemiBold', fontWeight: '600', color: COLORS.textMuted },
  toggleTextActive:{ color: '#FFFFFF', fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },

  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600' },
  emptyIcon:   { fontSize: 52, marginBottom: 12 },
  emptyTitle:  { fontSize: 20, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  emptySub:    { fontSize: 15.5, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  refreshBtn:  { borderRadius: RADIUS.md, paddingHorizontal: 24, paddingVertical: 10 },
  refreshBtnText: { color: '#fff', fontFamily: 'Outfit_SemiBold', fontWeight: '700', fontSize: 15.5 },

  list:       { padding: 16 },
  listHeader: { fontSize: 15.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },

  map: { flex: 1 },
  hidden: { opacity: 0, zIndex: -1 },
  banner: { marginHorizontal: 16, marginTop: 12 },
  callout:         { width: 210, padding: 4 },
  calloutPlate:    { fontSize: 16, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: COLORS.textPrimary, marginBottom: 2 },
  calloutDetail:   { fontSize: 13.5, color: COLORS.textSecondary, fontFamily: 'Outfit_Regular', fontWeight: '500' },
  calloutViolation:{ fontSize: 13.5, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.warning, marginTop: 4 },
  calloutAction:   { fontSize: 13.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: T.accent, marginTop: 6 },
}));
