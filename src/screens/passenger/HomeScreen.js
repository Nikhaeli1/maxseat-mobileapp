import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, StatusBar,
  Alert, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { fetchAllPuvs } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import AnimatedListItem from '../../components/AnimatedListItem';
import TutorialOverlay from '../../components/TutorialOverlay';
import { COLORS, ROLE, SHADOW, RADIUS , FONTS} from '../../theme';

const T = ROLE.passenger;
const { width: W, height: H } = Dimensions.get('window');
const DASH_TUTORIAL_KEY = '@maxseat_dash_tutorial_passenger';

export default function HomeScreen({ navigation }) {
  const { user, dashTutorialRequest, clearDashTutorialRequest } = useAuth();
  const [puvs,       setPuvs]             = useState([]);
  const [filtered,   setFiltered]         = useState([]);
  const [query,      setQuery]            = useState('');
  const [loading,    setLoading]          = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [showTutorial, setShowTutorial]   = useState(false);

  // Refs for coach-mark spotlight
  const topBarRef  = useRef(null);
  const searchRef  = useRef(null);
  const listRef    = useRef(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await fetchAllPuvs();
      const list = data.puvs || [];
      setPuvs(list);
      setFiltered(list);
    } catch (err) {
      Alert.alert('Error', 'Could not load PUV data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load data on focus
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Check if tutorial should show (first visit OR replay request from Profile)
  useFocusEffect(useCallback(() => {
    (async () => {
      if (dashTutorialRequest === 'passenger') {
        clearDashTutorialRequest();
        setShowTutorial(true);
      } else {
        const seen = await AsyncStorage.getItem(DASH_TUTORIAL_KEY);
        if (!seen) setShowTutorial(true);
      }
    })();
  }, [dashTutorialRequest, clearDashTutorialRequest]));

  const handleTutorialDone = useCallback(async () => {
    await AsyncStorage.setItem(DASH_TUTORIAL_KEY, '1');
    setShowTutorial(false);
  }, []);

  const handleSearch = (text) => {
    setQuery(text);
    const q = text.toUpperCase();
    setFiltered(puvs.filter(p =>
      p.plate.toUpperCase().includes(q) ||
      p.driver.toUpperCase().includes(q) ||
      p.route.toUpperCase().includes(q)
    ));
  };

  const statusColor = (p) => p.overloaded ? COLORS.danger : p.load_pct >= 80 ? COLORS.warning : '#16a34a';
  const statusLabel = (p) => p.overloaded ? 'OVERLOADED' : p.load_pct >= 80 ? 'NEARLY FULL' : 'AVAILABLE';

  const renderItem = ({ item }) => {
    const color = statusColor(item);
    const label = statusLabel(item);
    return (
      <TouchableOpacity
        style={[styles.card, item.overloaded && styles.cardOverloaded]}
        onPress={() => navigation.navigate('PuvDetail', { plate: item.plate })}
        activeOpacity={0.82}
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

        {/* Capacity bar */}
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.min(item.load_pct, 100)}%`, backgroundColor: color }]} />
        </View>
        <View style={styles.loadRow}>
          <Text style={styles.loadLabel}>👥 {item.passengers} / {item.capacity} passengers</Text>
          <Text style={[styles.loadPct, { color }]}>{item.load_pct}%</Text>
        </View>

        {/* Meta chips */}
        <View style={styles.chipRow}>
          <View style={styles.chip}><Text style={styles.chipText}>🚗 {item.driver}</Text></View>
          <View style={styles.chip}><Text style={styles.chipText} numberOfLines={1}>📍 {item.loc_name}</Text></View>
          {item.hot && (
            <View style={[styles.chip, styles.chipHot]}>
              <Text style={[styles.chipText, { color: COLORS.warning }]}>🌡 {item.temp}°C</Text>
            </View>
          )}
        </View>

        <Text style={[styles.viewMore, { color: T.primary }]}>View Details →</Text>
      </TouchableOpacity>
    );
  };

  // Tutorial step definitions
  const tutorialSteps = [
    {
      targetRef: topBarRef,
      title: 'Live PUV Tracker',
      desc: 'This is your main dashboard, showing all active PUVs on the Bugo–Igpit corridor in real time. Critical alerts appear here.',
    },
    {
      targetRef: searchRef,
      title: 'Smart Search',
      desc: 'Search by plate number, driver name, or route to instantly filter the list. Results update as you type.',
    },
    {
      targetRef: listRef,
      title: 'PUV Cards',
      desc: 'Each card shows a vehicle\'s real-time capacity, status, driver, and location. Tap any card to see full details or file a violation report.',
    },
    {
      targetRect: { x: 0, y: H - 82, w: W, h: 82 },
      title: 'Bottom Navigation',
      desc: 'Use these tabs to switch between the Live Tracker, Map View, your submitted Reports, and Profile settings.',
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />

      {/* TOP BAR */}
      <View ref={topBarRef} style={styles.topBar}>
        <View style={styles.topLeft}>
          <Logo size="header" style={{ marginBottom: 10 }} />
          <View style={styles.passengerPill}>
            <Text style={styles.passengerPillText}>PASSENGER</Text>
          </View>
          <Text style={styles.topTitle}>Live PUV Tracker</Text>
          <Text style={styles.topSub}>{user?.full_name} · Bugo–Igpit</Text>
        </View>
        {puvs.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: T.primary }]}>
            <Text style={styles.countText}>{puvs.length}</Text>
          </View>
        )}
      </View>

      {/* SEARCH BAR */}
      <View ref={searchRef} style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search plate, driver, or route…"
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CONTENT AREA — wrapped in listRef for tutorial spotlight */}
      <View ref={listRef} style={{ flex: 1 }}>
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={T.primary} />
            <Text style={styles.loadingText}>Loading PUV data…</Text>
          </View>
        )}

        {!loading && filtered.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>🚌</Text>
            <Text style={styles.emptyTitle}>{query ? 'No Results' : 'No Active PUVs'}</Text>
            <Text style={styles.emptySub}>{query ? 'Try a different search term.' : 'No PUVs are currently active.'}</Text>
            {!query && (
              <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: T.primary }]} onPress={() => load(true)}>
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!loading && filtered.length > 0 && (
          <FlatList
            data={filtered}
            keyExtractor={item => String(item.puv_id)}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.primary} />
            }
            ListHeaderComponent={
              <Text style={styles.listHeader}>{filtered.length} PUV{filtered.length !== 1 ? 's' : ''} on route</Text>
            }
            renderItem={({ item, index }) => (
              <AnimatedListItem index={index}>
                {renderItem({ item, index })}
              </AnimatedListItem>
            )}
          />
        )}
      </View>

      {/* TUTORIAL OVERLAY */}
      <TutorialOverlay
        visible={showTutorial}
        steps={tutorialSteps}
        accentColor={T.primary}
        onDone={handleTutorialDone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.pageBg },

  topBar:    { backgroundColor: COLORS.cardBg, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: COLORS.border, ...SHADOW.sm },
  topLeft:   {},
  passengerPill: { backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: RADIUS.badge, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(37,99,235,0.25)', alignSelf: 'flex-start', marginBottom: 8 },
  passengerPillText: { fontSize: 10, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: T.primary, letterSpacing: 0.5 },
  topTitle:  { fontSize: 22, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.3 },
  topSub:    { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', marginTop: 3 },
  countBadge:{ borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { color: '#fff', fontSize: 13, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, margin: 16, borderRadius: RADIUS.lg, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary, fontFamily: 'PlusJakartaSans_Regular', fontWeight: '500' },
  clearBtn:    { fontSize: 14, color: COLORS.textMuted, paddingLeft: 8 },

  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: T.primary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600' },
  emptyIcon:   { fontSize: 52, marginBottom: 12 },
  emptyTitle:  { fontSize: 20, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  emptySub:    { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  refreshBtn:  { borderRadius: RADIUS.md, paddingHorizontal: 24, paddingVertical: 10 },
  refreshBtnText: { color: '#fff', fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', fontSize: 14 },

  list:       { padding: 16, paddingTop: 0 },
  listHeader: { fontSize: 11, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  card:           { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  cardOverloaded: { borderLeftWidth: 4, borderLeftColor: COLORS.danger, borderColor: COLORS.dangerLight },
  cardHeader:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  plate:          { fontSize: 22, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  route:          { fontSize: 12, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600', marginTop: 2 },
  statusPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: RADIUS.badge, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  statusDot:      { width: 6, height: 6, borderRadius: 3 },
  statusText:     { fontSize: 10, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', letterSpacing: 0.5 },

  barBg:    { height: 8, backgroundColor: COLORS.borderLight, borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
  barFill:  { height: 8, borderRadius: 4 },
  loadRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  loadLabel:{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600' },
  loadPct:  { fontSize: 13, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800' },

  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip:     { backgroundColor: COLORS.pageBg, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  chipHot:  { backgroundColor: '#fffbeb', borderColor: COLORS.warning + '55' },
  chipText: { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '600' },
  viewMore: { fontSize: 13, fontFamily: 'PlusJakartaSans_ExtraBold', fontWeight: '800', textAlign: 'right' },
});
