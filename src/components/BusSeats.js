import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, IS_DARK, FONTS, themed, byMode } from '../theme';

// Live cabin view: a top-down PUV (front at the top), seats in rows of 2 + aisle + 2.
// Taken seat  = green seat with a white person.
// Free seat   = plain light seat.
// Standing    = lime person in the aisle (or by the door) once every seat is taken.
const LIME = '#C6F24E';
const W = 190;                       // drawing width; everything below is laid out on this grid
const COLS = [24, 53, 113, 142];     // seat x positions (aisle sits between 77 and 113)
const Y0 = 66;                       // first passenger row
const PITCH = 30;                    // row spacing

const C = byMode(() => (IS_DARK
  ? { body: '#1B1F1D', frame: '#9BA8A1', glass: '#343A36', aisle: '#202522', empty: '#343A36', emptyBack: '#3D4540', seat: '#3E8A70', seatBack: '#245847' }
  : { body: '#FFFFFF', frame: '#5E6F67', glass: '#DCE8E1', aisle: '#EEF5F1', empty: '#DCE8E1', emptyBack: '#C3D6CC', seat: '#2F6F5A', seatBack: '#245847' }));

function Person({ color, big }) {
  const head = big ? 9 : 8;
  const torsoW = big ? 16 : 14;
  const torsoH = big ? 9 : 7;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: head, height: head, borderRadius: head / 2, backgroundColor: color }} />
      <View style={{ width: torsoW, height: torsoH, marginTop: 1, borderTopLeftRadius: torsoW / 2, borderTopRightRadius: torsoW / 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: color }} />
    </View>
  );
}

function Seat({ x, y, bg, back, person }) {
  return (
    <View style={[styles.seat, { left: x, top: y, backgroundColor: bg, borderBottomColor: back }]}>
      {person ? <Person color={person} /> : null}
    </View>
  );
}

export default function BusSeats({ passengers = 0, capacity = 20, scale = 1, showCaption = true }) {
  const cap = Math.max(8, Math.min(32, Math.round(capacity / 4) * 4));
  const rows = cap / 4;
  const seated = Math.min(passengers, cap);
  const extra = Math.max(0, passengers - cap);
  // Spread riders around the cabin instead of filling front to back
  const filled = new Set(Array.from({ length: seated }, (_, i) => (i * 11) % cap));

  const bodyH = 60 + rows * PITCH + 16;
  const busH = 6 + bodyH + 2;

  const aisleSlots = Math.floor((rows * PITCH) / 22);
  const inAisle = Math.min(extra, aisleSlots);
  const doorSpots = [[113, 30], [86, 34]];
  const atDoor = Math.min(Math.max(0, extra - inAisle), doorSpots.length);

  const free = Math.max(0, cap - passengers);
  let headline;
  let sub;
  if (extra > 0) { headline = `${extra} too many`; sub = `${passengers} riders · ${cap} seats`; }
  else if (free <= 3) { headline = free === 0 ? 'Full' : `${free} ${free === 1 ? 'seat' : 'seats'} left`; sub = 'Squeeze in fast'; }
  else { headline = `${free} seats free`; sub = `${passengers} sakay · ${cap} seats`; }

  return (
    <View style={{ width: W * scale, alignItems: 'center' }}
      accessible accessibilityRole="image"
      accessibilityLabel={`Seat map: ${passengers} riders, ${cap} seats${extra > 0 ? `, ${extra} standing` : ''}`}>
      <View style={{ width: W * scale, height: busH * scale }}>
        <View style={{ width: W, height: busH, transform: [{ translateX: -(W * (1 - scale)) / 2 }, { translateY: -(busH * (1 - scale)) / 2 }, { scale }] }}>
          {/* mirrors */}
          <View style={[styles.abs, { left: 4, top: 10, width: 12, height: 2.5, backgroundColor: C.frame }]} />
          <View style={[styles.abs, { left: 2, top: 10, width: 6, height: 20, borderRadius: 3, backgroundColor: C.frame }]} />
          <View style={[styles.abs, { left: 174, top: 10, width: 12, height: 2.5, backgroundColor: C.frame }]} />
          <View style={[styles.abs, { left: 182, top: 10, width: 6, height: 20, borderRadius: 3, backgroundColor: C.frame }]} />
          {/* body, windshield, rear window, aisle, door */}
          <View style={[styles.abs, { left: 14, top: 6, width: 162, height: bodyH, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: C.body, borderWidth: 2.5, borderColor: C.frame }]} />
          <View style={[styles.abs, { left: 20, top: 12, width: 150, height: 8, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: C.glass }]} />
          <View style={[styles.abs, { left: 32, top: 6 + bodyH - 11, width: 126, height: 5, borderRadius: 3, backgroundColor: C.glass }]} />
          <View style={[styles.abs, { left: 82, top: 30, width: 26, height: bodyH - 40, borderRadius: 6, backgroundColor: C.aisle }]} />
          <View style={[styles.abs, { left: 172, top: 34, width: 4, height: 38, borderRadius: 2, backgroundColor: C.frame }]} />

          {/* driver (front left) and front right seat */}
          <Seat x={24} y={28} bg={LIME} back="#9DC72A" person="#14211B" />
          <Seat x={142} y={28} bg={LIME} back="#9DC72A" />

          {Array.from({ length: rows }, (_, r) => COLS.map((x, k) => {
            const idx = r * 4 + k;
            const on = filled.has(idx);
            return (
              <Seat key={idx} x={x} y={Y0 + r * PITCH}
                bg={on ? C.seat : C.empty} back={on ? C.seatBack : C.emptyBack}
                person={on ? '#FFFFFF' : null} />
            );
          }))}

          {Array.from({ length: inAisle }, (_, i) => (
            <View key={`a${i}`} style={[styles.abs, styles.stander, { left: 86, top: Y0 + 2 + i * 22 }]}>
              <Person color={LIME} big />
            </View>
          ))}
          {Array.from({ length: atDoor }, (_, i) => (
            <View key={`d${i}`} style={[styles.abs, styles.stander, { left: doorSpots[i][0], top: doorSpots[i][1] }]}>
              <Person color={LIME} big />
            </View>
          ))}
        </View>
      </View>
      {showCaption ? (
        <View style={styles.caption}>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.sub}>{sub}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = themed(() => ({
  abs:      { position: 'absolute' },
  seat:     { position: 'absolute', width: 24, height: 25, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, borderBottomWidth: 5, alignItems: 'center', paddingTop: 2 },
  stander:  { width: 18, height: 20, alignItems: 'center', justifyContent: 'center' },
  caption:  { alignItems: 'center', marginTop: 8 },
  headline: { fontSize: 15, fontFamily: FONTS.extraBold, color: COLORS.textPrimary },
  sub:      { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginTop: 1 },
}));
