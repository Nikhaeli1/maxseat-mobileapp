import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar, RefreshControl, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { fetchPassengerReports, setPassengerReportStatus } from '../../api/apiService';
import { friendlyError } from '../../api/errors';
import { showToast } from '../../components/Toast';
import Logo from '../../components/Logo';
import { GradientFill } from '../../components/Gradient';
import AnimatedListItem from '../../components/AnimatedListItem';
import SkeletonList from '../../components/Skeleton';
import ErrorBanner from '../../components/ErrorBanner';
import LiveStamp from '../../components/LiveStamp';
import useLiveData from '../../hooks/useLiveData';
import { publishNewReports } from '../../hooks/reportBadge';
import Icon from '../../components/Icon';
import { COLORS, ROLE, SHADOW, RADIUS, themed, byMode } from '../../theme';

const T = ROLE.enforcer;
const MAX_NOTE = 300;

const TYPE_ICON = {
  overload: 'people-outline',
  thermal:  'thermometer-outline',
  other:    'alert-circle-outline',
};

// open = new, waiting for LTFRB. reviewed = being looked into. resolved = action taken.
const STATUS = byMode(() => ({
  open:     { label: 'New',          icon: 'alert-circle-outline',     color: COLORS.onAlert, bg: COLORS.alert },
  reviewed: { label: 'Under review', icon: 'search-outline',           color: COLORS.warning, bg: COLORS.warningBg },
  resolved: { label: 'Resolved',     icon: 'checkmark-circle-outline', color: COLORS.success, bg: COLORS.successBg },
}));

const FILTERS = [
  { key: 'open',     label: 'New' },
  { key: 'reviewed', label: 'Under review' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'all',      label: 'All' },
];

const when = (iso) => (iso ? iso.replace('T', ' ').slice(0, 16) : '—');

export default function PassengerReportsScreen() {
  // Refreshes when the tab opens and every 20 s while it stays open
  const live    = useLiveData(fetchPassengerReports, { interval: 20000 });
  const reports = useMemo(() => live.data?.reports || [], [live.data]);
  const counts  = live.data?.counts || { open: 0, reviewed: 0, resolved: 0, all: 0 };
  useEffect(() => { if (live.data?.counts) publishNewReports(live.data.counts.open); }, [live.data]);

  const [filter,  setFilter]  = useState('open');
  const [saving,  setSaving]  = useState(null);          // serial being saved
  const [resolve, setResolve] = useState(null);          // report waiting for its note
  const [note,    setNote]    = useState('');

  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const shown = useMemo(
    () => (filter === 'all' ? reports : reports.filter(r => (r.status || 'open') === filter)),
    [reports, filter],
  );

  const save = async (report, status, withNote) => {
    setSaving(report.serial);
    try {
      await setPassengerReportStatus(report.serial, status, withNote);
      showToast(
        status === 'resolved' ? `${report.serial} resolved. The passenger can see it now.`
          : status === 'reviewed' ? `${report.serial} is now under review.`
          : `${report.serial} reopened.`,
      );
      setResolve(null);
      setNote('');
      live.reload();
    } catch (err) {
      showToast(friendlyError(err, "Couldn't save. Please try again."), { duration: 3600 });
    } finally {
      setSaving(null);
    }
  };

  const renderItem = ({ item }) => {
    const st   = STATUS[item.status] ? item.status : 'open';
    const sc   = STATUS[st];
    const busy = saving === item.serial;
    return (
      <View style={[styles.card, st === 'open' && styles.cardNew]}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, st === 'open' && { backgroundColor: COLORS.alert }]}>
            <Icon name={TYPE_ICON[item.complaint] || TYPE_ICON.other} size={22}
                  color={st === 'open' ? COLORS.onAlert : T.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.typeName}>{item.type_label}</Text>
            <Text style={styles.plate}>{item.plate}{item.company ? ` · ${item.company}` : ''}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Icon name={sc.icon} size={13} color={sc.color} />
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          {[
            ['Sent',     when(item.timestamp)],
            ['Pax then', item.passengers != null ? `${item.passengers}/${item.capacity}` : '—'],
            ['Temp then', item.temp != null ? `${item.temp}°C` : '—'],
            ['Driver',   item.driver || '—'],
          ].map(([label, value]) => (
            <View key={label} style={styles.infoItem}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
            </View>
          ))}
        </View>

        {item.loc_name ? (
          <View style={styles.metaRow}>
            <Icon name="location-outline" size={15} color={COLORS.textMuted} />
            <Text style={styles.metaText} numberOfLines={2}>{item.loc_name}</Text>
          </View>
        ) : null}

        {item.description ? (
          <View style={styles.descBox}>
            <Text style={styles.descText}>"{item.description}"</Text>
          </View>
        ) : null}

        <Text style={styles.reporter}>Reference {item.serial}{item.reporter ? ` · reported by ${item.reporter}` : ''}</Text>

        {st !== 'open' && item.status_at ? (
          <View style={styles.updateBox}>
            <Text style={styles.updateHead}>{sc.label} · {when(item.status_at)}</Text>
            {item.note ? <Text style={styles.updateNote}>{item.note}</Text> : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          {busy ? (
            <ActivityIndicator color={T.primary} style={{ paddingVertical: 10 }} />
          ) : (
            <>
              {st === 'open' && (
                <TouchableOpacity style={[styles.btn, styles.btnOutline]} activeOpacity={0.8}
                                  onPress={() => save(item, 'reviewed')}>
                  <Icon name="search-outline" size={16} color={COLORS.textPrimary} />
                  <Text style={styles.btnOutlineText}>Under review</Text>
                </TouchableOpacity>
              )}
              {st !== 'resolved' ? (
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} activeOpacity={0.85}
                                  onPress={() => { setNote(''); setResolve(item); }}>
                  <GradientFill name="button" />
                  <Icon name="checkmark" size={17} color="#FFFFFF" />
                  <Text style={styles.btnPrimaryText}>Resolve</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} activeOpacity={0.8}
                                  onPress={() => save(item, 'open')}>
                  <Icon name="refresh-outline" size={16} color={T.accent} />
                  <Text style={styles.btnGhostText}>Reopen</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={styles.header}>
        <GradientFill name="brand" glow />
        <Logo size="header" onDark style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Passenger reports</Text>
        <Text style={styles.sub}>Violations passengers reported in the MaxSeat app</Text>
        <LiveStamp updatedAt={live.updatedAt} busy={live.busy} error={live.error} onDark style={{ marginTop: 8 }} />
      </View>

      {/* FILTERS (float over the bottom of the header) */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const on = filter === f.key;
          return (
            <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} activeOpacity={0.8}
                              style={[styles.filterBtn, on && styles.filterBtnOn]}
                              accessibilityRole="button" accessibilityState={{ selected: on }}>
              <Text style={[styles.filterCount, on && styles.filterTextOn]}>{counts[f.key] ?? 0}</Text>
              <Text style={[styles.filterLabel, on && styles.filterTextOn]} numberOfLines={1}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {live.error && !live.loading && (
        <ErrorBanner error={live.error} onRetry={live.reload} busy={live.busy} style={{ marginHorizontal: 16, marginTop: 12 }} />
      )}

      {live.loading && <SkeletonList count={2} variant="report" />}

      {!live.loading && (
        <FlatList
          ref={scrollRef}
          data={shown}
          keyExtractor={(item) => item.serial}
          contentContainerStyle={shown.length ? styles.list : styles.emptyWrap}
          refreshControl={<RefreshControl refreshing={live.refreshing} onRefresh={live.refresh} tintColor={T.primary} colors={[T.primary]} />}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>{renderItem({ item })}</AnimatedListItem>
          )}
          ListEmptyComponent={
            live.error ? null : (
              <View style={styles.centered}>
                <Icon name={filter === 'open' ? 'checkmark-done-outline' : 'megaphone-outline'} size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>{filter === 'open' ? 'No new reports' : 'Nothing here'}</Text>
                <Text style={styles.emptySub}>
                  {filter === 'open'
                    ? 'When a passenger reports a PUV in the app, it shows up here.'
                    : 'No reports with this status right now.'}
                </Text>
              </View>
            )
          }
        />
      )}

      {/* RESOLVE: optional note the passenger will see */}
      <Modal visible={!!resolve} transparent animationType="fade" onRequestClose={() => setResolve(null)}>
        <KeyboardAvoidingView style={styles.modalBack} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Resolve {resolve?.serial}?</Text>
            <Text style={styles.modalSub}>
              {resolve?.type_label} · {resolve?.plate}. Add what was done (optional). The passenger sees this note.
            </Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Example: Driver cited for overloading at Cogon."
              placeholderTextColor={COLORS.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={MAX_NOTE}
              textAlignVertical="top"
            />
            <Text style={styles.noteCount}>{note.length}/{MAX_NOTE}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => setResolve(null)} disabled={!!saving}>
                <Text style={styles.btnOutlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} disabled={!!saving}
                                onPress={() => save(resolve, 'resolved', note.trim())}>
                <GradientFill name="button" />
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Mark resolved</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = themed(() => ({
  root: { flex: 1, backgroundColor: COLORS.pageBg },

  header: { backgroundColor: COLORS.dark, overflow: 'hidden', paddingTop: 52, paddingBottom: 46, paddingHorizontal: 20, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl },
  title:  { fontSize: 26, lineHeight: 32, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4 },
  sub:    { fontSize: 14.5, color: 'rgba(255,255,255,0.82)', fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 3 },

  filterRow:    { flexDirection: 'row', backgroundColor: COLORS.cardBg, marginHorizontal: 16, marginTop: -30, marginBottom: 6, padding: 5, gap: 4, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.md },
  filterBtn:    { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: RADIUS.md },
  filterBtnOn:  { backgroundColor: COLORS.primary },
  filterCount:  { fontSize: 20, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: COLORS.textPrimary },
  filterLabel:  { fontSize: 11.5, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textSecondary, marginTop: 1 },
  filterTextOn: { color: '#FFFFFF' },

  list:      { padding: 16, paddingBottom: 28 },
  emptyWrap: { flexGrow: 1 },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 6 },
  emptyTitle:{ fontSize: 18, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary, marginTop: 6 },
  emptySub:  { fontSize: 14.5, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },

  card:       { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  cardNew:    { borderColor: COLORS.alert, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  typeIcon:   { width: 46, height: 46, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', backgroundColor: T.primaryLight },
  typeName:   { fontSize: 15, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },
  plate:      { fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '700', marginTop: 2 },
  statusBadge:{ borderRadius: RADIUS.badge, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 12, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },

  infoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoItem:  { width: '48%', flexGrow: 1, backgroundColor: COLORS.pageBg, borderRadius: RADIUS.sm, padding: 10, borderWidth: 1, borderColor: COLORS.border },
  infoLabel: { fontSize: 11, fontFamily: 'Outfit_SemiBold', fontWeight: '700', color: COLORS.textMuted, marginBottom: 3 },
  infoValue: { fontSize: 14.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },

  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  metaText: { flex: 1, fontSize: 13.5, color: COLORS.textSecondary, fontFamily: 'Outfit_SemiBold', fontWeight: '600' },

  descBox:  { marginTop: 10, borderRadius: RADIUS.sm, padding: 10, backgroundColor: T.primaryLight },
  descText: { fontSize: 14, fontStyle: 'italic', lineHeight: 19, color: COLORS.textPrimary },
  reporter: { fontSize: 12, color: COLORS.textMuted, fontFamily: 'Outfit_SemiBold', fontWeight: '600', marginTop: 10 },

  updateBox:  { marginTop: 10, borderRadius: RADIUS.sm, padding: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.pageBg },
  updateHead: { fontSize: 12.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', color: COLORS.textPrimary },
  updateNote: { fontSize: 13.5, lineHeight: 19, color: COLORS.textSecondary, marginTop: 4 },

  actions:        { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  btn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: RADIUS.md, paddingHorizontal: 16, height: 44, overflow: 'hidden' },
  btnPrimary:     { backgroundColor: T.primary, ...SHADOW.button },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },
  btnOutline:     { borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.cardBg },
  btnOutlineText: { color: COLORS.textPrimary, fontSize: 14.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },
  btnGhost:       { backgroundColor: 'transparent' },
  btnGhostText:   { color: T.accent, fontSize: 14.5, fontFamily: 'Outfit_ExtraBold', fontWeight: '800' },

  modalBack:    { flex: 1, backgroundColor: 'rgba(10,16,13,0.55)', justifyContent: 'center', padding: 20 },
  modalCard:    { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl, padding: 20, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.md },
  modalTitle:   { fontSize: 19, fontFamily: 'Outfit_ExtraBold', fontWeight: '900', color: COLORS.textPrimary },
  modalSub:     { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginTop: 6, marginBottom: 12 },
  noteInput:    { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, minHeight: 96, fontSize: 15, color: COLORS.textPrimary, backgroundColor: COLORS.pageBg, fontFamily: 'Outfit_Regular', fontWeight: '500' },
  noteCount:    { fontSize: 12, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
}));
