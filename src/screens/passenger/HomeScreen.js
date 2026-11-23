import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, StatusBar, Dimensions, Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import { fetchAllPuvs } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import AnimatedListItem from '../../components/AnimatedListItem';
import PressableScale from '../../components/PressableScale';
import AnimatedBar from '../../components/AnimatedBar';
import SkeletonList from '../../components/Skeleton';
import ErrorBanner from '../../components/ErrorBanner';
import LiveStamp from '../../components/LiveStamp';
import useLiveData from '../../hooks/useLiveData';
import Icon from '../../components/Icon';
import { useTutorial } from '../../context/TutorialContext';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS, themed } from '../../theme';

const T = ROLE.passenger;
const { width: W, height: H } = Dimensions.get('window');
const DASH_TUTORIAL_KEY = '@maxseat_dash_tutorial_passenger_v2';

// Quick filters above the list
const FILTERS = [
  { key: 'all',   label: 'All' },
  { key: 'free',  label: 'Seats free' },
  { key: 'near',  label: 'Nearly full' },
  { key: 'over',  label: 'Overloaded' },
];
const bucket = (p) => (p.overloaded ? 'over' : p.load_pct >= 80 ? 'near' : 'free');

export default function HomeScreen({ navigation }) {
  const { user, dashTutorialRequest, clearDashTutorialRequest } = useAuth();
  const { startTutorial, stopTutorial } = useTutorial();
  const [query,  setQuery]  = useState('');
  const [filter, setFilter] = useState('all');

  // Live list: refreshes on focus and every 15 s, never blanks the screen
  const live    = useLiveData(fetchAllPuvs, { interval: 15000 });
  const puvs    = useMemo(() => live.data?.puvs || [], [live.data]);
  const loading = live.loading;

  // Tap the PUVs tab again to jump back to the top
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  // Refs for coach-mark spotlight
  const topBarRef  = useRef(null);
  const searchRef  = useRef(null);
  const listRef    = useRef(null);

  // Tutorial steps — stable identity (they only close over refs)
  const tutorialSteps = useRef([
    {
      targetRef: topBarRef,
      icon: 'bus-outline',
      title: 'Your live PUV list',
      desc: 'Every active PUV on the Bugo–Igpit route, updated live. Pull down anytime to refresh.',
    },
    {
      targetRef: searchRef,
      icon: 'search-outline',
      title: 'Find one fast',
      desc: 'Type a plate number, driver or route. The list filters as you type.',
    },
    {
      targetRef: listRef,
      icon: 'reader-outline',
      title: 'Read a card at a glance',
      desc: 'Plain outline = seats free. Lime outline = nearly full. Solid lime = overloaded. Tap a card to see the live cabin view.',
    },
    {
      targetRect: { h: 82, fromBottom: true },
      icon: 'compass-outline',
      title: 'Get around',
      desc: 'PUVs, Live map, Reports and Profile. You can replay this tour anytime from Profile.',
    },
  ]).current;

  const handleTutorialDone = useCallback(async () => {
    await AsyncStorage.setItem(DASH_TUTORIAL_KEY, '1');
  }, []);

  const launchTutorial = useCallback(() => {
    startTutorial(tutorialSteps, {
      accentColor: T.primary,
      onDone: handleTutorialDone,
    });
  }, [startTutorial, tutorialSteps, handleTutorialDone]);

  // ── First visit ──────────────────────────────────────────────────────────
  // Guarded by a ref so re-focusing the tab doesn't re-check or re-trigger.
  const firstVisitChecked = useRef(false);
  useFocusEffect(useCallback(() => {
    let timer;
    let cancelled = false;
    if (!firstVisitChecked.current) {
      firstVisitChecked.current = true;
      (async () => {
        const seen = await AsyncStorage.getItem(DASH_TUTORIAL_KEY);
        if (!seen && !cancelled) timer = setTimeout(launchTutorial, 500);
      })();
    }
    // Leaving this screen: cancel a pending start and close any tour still open
    return () => { cancelled = true; clearTimeout(timer); stopTutorial(); };
  }, [launchTutorial, stopTutorial]));

  // ── Replay requested from Profile ────────────────────────────────────────
  // The flag is cleared INSIDE the timeout, not before it. Clearing it early
  // changes the dependency, which re-runs this effect and cancels the very
  // timer it just scheduled — that's why replay silently did nothing.
  useEffect(() => {
    if (dashTutorialRequest !== 'passenger') return undefined;
    const timer = setTimeout(() => {
      clearDashTutorialRequest();
      launchTutorial();
    }, 500);
    return () => clearTimeout(timer);
  }, [dashTutorialRequest, clearDashTutorialRequest, launchTutorial]);

  // Search + quick filter, worked out from the live list every time it changes
  const counts = useMemo(() => {
    const c = { all: puvs.length, free: 0, near: 0, over: 0 };
    puvs.forEach((p) => { c[bucket(p)] += 1; });
    return c;
  }, [puvs]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return puvs.filter((p) => {
      if (filter !== 'all' && bucket(p) !== filter) return false;
      if (!q) return true;
      return [p.plate, p.driver, p.route, p.company, p.loc_name]
        .some((v) => String(v || '').toUpperCase().includes(q));
    });
  }, [puvs, query, filter]);

  const handleSearch = (text) => setQuery(text);

  const statusColor = (p) => p.overloaded ? COLORS.danger : p.load_pct >= 80 ? COLORS.warning : COLORS.success;
  const statusLabel = (p) => p.overloaded ? 'OVERLOADED' : p.load_pct >= 80 ? 'NEARLY FULL' : 'AVAILABLE';

  const renderItem = ({ item }) => {
    const color = statusColor(item);
    const label = statusLabel(item);
    return (
      <PressableScale
        style={[styles.card, item.overloaded && styles.cardOverloaded]}
        onPress={() => { Keyboard.dismiss(); navigation.navigate('PuvDetail', { plate: item.plate, preview: item }); }}
        accessibilityRole="button"
        accessibilityLabel={`${item.plate}, ${label.toLowerCase()}, ${item.passengers} of ${item.capacity} passengers`}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.plate}>{item.plate}</Text>
            <Text style={styles.route}>{item.route} · {item.company}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: color + '18', borderColor: color + '55' }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>{label}</Text>
          </View>
        </View>

        {/* Capacity bar (glides when the count changes) */}
        <View style={styles.barWrap}>
          <AnimatedBar pct={item.load_pct} color={color} track={COLORS.borderLight} height={8} />
        </View>
        <View style={styles.loadRow}>
          <Text style={styles.loadLabel}>{item.passengers} / {item.capacity} passengers</Text>
          <Text style={[styles.loadPct, { color }]}>{item.load_pct}%</Text>
        </View>

        {/* Meta chips */}
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Icon name="person-outline" size={12} />
            <Text style={styles.chipText}>{item.driver}</Text>
          </View>
          <View style={styles.chip}>
            <Icon name="location-outline" size={12} />
            <Text style={styles.chipText} numberOfLines={1}>{item.loc_name}</Text>
          </View>
          {item.hot && (
            <View style={[styles.chip, styles.chipHot]}>
              <Icon name="thermometer-outline" size={12} color={COLORS.warning} />
              <Text style={[styles.chipText, { color: COLORS.warning }]}>{item.temp}°C</Text>
            </View>
          )}
        </View>

        <View style={styles.viewMoreRow}>
          <Text style={[styles.viewMore, { color: T.accent }]}>View details</Text>
          <Icon name="chevron-forward" size={15} color={T.accent} />
        </View>
      </PressableScale>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={COLORS.statusBar} backgroundColor={COLORS.cardBg} />

      {/* TOP BAR */}
      <View ref={topBarRef} style={styles.topBar}>
        <View style={styles.topLeft}>
          <Logo size="header" style={{ marginBottom: 10 }} />
          <View style={styles.passengerPill}>
            <Text style={styles.passengerPillText}>PASSENGER</Text>
          </View>
          <Text style={styles.topTitle}>Live PUV Tracker</Text>
          <Text style={styles.topSub}>{user?.full_name} · Bugo–Igpit</Text>
          <LiveStamp updatedAt={live.updatedAt} busy={live.busy} error={live.error} style={{ marginTop: 6 }} />
        </View>
        {puvs.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: T.primary }]}>
            <Text style={styles.countText}>{puvs.length}</Text>
          </View>
        )}
      </View>

      {/* SEARCH BAR */}
      <View ref={searchRef} style={styles.searchWrap}>
        <Icon name="search" size={17} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search plate, driver, or route…"
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoCorrect={false}
          autoCapitalize="characters"
          returnKeyType="search"
          clearButtonMode="never"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Clear search">
            <Icon name="close-circle" size={18} color={COLORS.textMuted} style={styles.clearBtn} />
          </TouchableOpacity>
        )}
      </View>

      {/* QUICK FILTERS */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, on && styles.filterChipOn, f.key === 'over' && counts.over > 0 && !on && styles.filterChipAlert]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.filterText, on && styles.filterTextOn]}>
                {f.label}{!loading ? ` ${counts[f.key]}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {live.error && puvs.length > 0 && (
        <ErrorBanner error={live.error} onRetry={live.reload} busy={live.busy} style={styles.banner} />
      )}

      {/* CONTENT AREA — wrapped in listRef for tutorial spotlight */}
      <View ref={listRef} style={{ flex: 1 }}>
        {loading && <SkeletonList count={3} />}

        {!loading && puvs.length === 0 && live.error && (
          <View style={styles.centered}>
            <Icon name="cloud-offline-outline" size={48} color={COLORS.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Can't load PUVs</Text>
            <ErrorBanner error={live.error} onRetry={live.reload} busy={live.busy} style={{ alignSelf: 'stretch' }} />
          </View>
        )}

        {!loading && filtered.length === 0 && !(puvs.length === 0 && live.error) && (
          <View style={styles.centered}>
            <Icon name="bus-outline" size={48} color={COLORS.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>{puvs.length ? 'No matches' : 'No Active PUVs'}</Text>
            <Text style={styles.emptySub}>
              {puvs.length
                ? (query ? 'Try a different plate, driver or place.' : 'No PUVs fit this filter right now.')
                : 'No PUVs are currently active.'}
            </Text>
            {puvs.length > 0 ? (
              <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: T.primary }]} onPress={() => { setQuery(''); setFilter('all'); }}>
                <Text style={styles.refreshBtnText}>Show all PUVs</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: T.primary }]} onPress={live.refresh}>
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!loading && filtered.length > 0 && (
          <FlatList
            ref={scrollRef}
            data={filtered}
            keyExtractor={item => String(item.puv_id)}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            refreshControl={
              <RefreshControl refreshing={live.refreshing} onRefresh={live.refresh} tintColor={T.primary} colors={[T.primary]} />
            }
            ListHeaderComponent={
              <Text style={styles.listHeader}>
                {filtered.length} PUV{filtered.length !== 1 ? 's' : ''}{filter === 'all' && !query ? ' on route' : ` of ${puvs.length}`}
              </Text>
            }
            renderItem={({ item, index }) => (
              <AnimatedListItem index={index}>
                {renderItem({ item, index })}
              </AnimatedListItem>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = themed(() => ({
  root: { flex: 1, backgroundColor: COLORS.pageBg },

  topBar:    { backgroundColor: COLORS.cardBg, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: COLORS.border, ...SHADOW.sm },
  topLeft:   {},
  passengerPill: { backgroundColor: 'rgba(47,111,90,0.1)', borderRadius: RADIUS.badge, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(47,111,90,0.25)', alignSelf: 'flex-start', marginBottom: 8 },
  passengerPillText: { fontSize: 10, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: T.accent, letterSpacing: 0.5 },
  topTitle:  { fontSize: 22, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.3 },
  topSub:    { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 3 },
  countBadge:{ borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { color: '#fff', fontSize: 13, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, marginHorizontal: 16, marginTop: 16, marginBottom: 10, borderRadius: RADIUS.lg, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary, fontFamily: 'Outfit_Regular', fontWeight: '500' },
  clearBtn:    { paddingLeft: 8 },

  filterRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, marginBottom: 12 },
  filterChip:      { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border },
  filterChipOn:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipAlert: { borderColor: COLORS.alert },
  filterText:      { fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '700' },
  filterTextOn:    { color: '#fff' },
  banner:          { marginHorizontal: 16, marginBottom: 10 },

  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: T.accent, fontFamily: 'Outfit_SemiBold', fontWeight: '600' },
  emptyIcon:   { marginBottom: 12 },
  emptyTitle:  { fontSize: 20, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  emptySub:    { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  refreshBtn:  { borderRadius: RADIUS.md, paddingHorizontal: 24, paddingVertical: 10 },
  refreshBtnText: { color: '#fff', fontFamily: 'Outfit_SemiBold', fontWeight: '700', fontSize: 14 },

  list:       { padding: 16, paddingTop: 0 },
  listHeader: { fontSize: 11, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  card:           { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  cardOverloaded: { borderLeftWidth: 4, borderLeftColor: COLORS.danger, borderColor: COLORS.dangerLight },
  cardHeader:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  plate:          { fontSize: 22, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  route:          { fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 2 },
  statusPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: RADIUS.badge, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  statusDot:      { width: 6, height: 6, borderRadius: 3 },
  statusText:     { fontSize: 10, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', letterSpacing: 0.5 },

  barWrap:  { marginBottom: 6 },
  loadRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  loadLabel:{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600' },
  loadPct:  { fontSize: 13, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },

  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%', backgroundColor: COLORS.pageBg, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  chipHot:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warningBg, borderColor: COLORS.warning + '55' },
  chipText: { flexShrink: 1, fontSize: 11, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600' },
  viewMoreRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 2 },
  viewMore: { fontSize: 13, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', textAlign: 'right' },
}));
