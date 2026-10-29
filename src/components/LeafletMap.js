import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { BASE_URL } from '../api/apiService';
import { buildMapHtml } from './mapHtml';

/**
 * Free map (Leaflet + OpenStreetMap) shown in a WebView.
 * Works in Expo Go and in the APK without a Google Maps API key.
 *
 * markers: [{ id, lat, lng, hasGps, color, title, lines: [text | {text, tone:'warn'|'bad'}], cta, radius }]
 *   • Vehicles with no GPS fix (hasGps false, or 0,0) show grey at the CDO center.
 *   • The map zooms to the vehicles on first load and when vehicles are added/removed.
 * onMarkerPress(id): called when the button inside a marker's popup (cta) is tapped.
 * interactive=false: fixed map (no pan/zoom), e.g. a small preview inside a scroll view.
 */
export default function LeafletMap({
  markers = [],
  onMarkerPress,
  interactive = true,
  showLocate = false,
  center,
  zoom,
  style,
}) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  // Built once per map; marker data is pushed in afterwards so the zoom/position is kept
  const html = useMemo(
    () => buildMapHtml({ baseUrl: BASE_URL, interactive, showLocate, center, zoom }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [interactive, showLocate],
  );

  const push = useCallback(() => {
    if (!ref.current) return;
    const json = JSON.stringify(markers || [])
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
    ref.current.injectJavaScript(`window.MS && window.MS.setMarkers(${json}); true;`);
  }, [markers]);

  useEffect(() => { if (ready) push(); }, [ready, push]);

  const onMessage = useCallback((e) => {
    let msg;
    try { msg = JSON.parse(e.nativeEvent.data); } catch (_) { return; }
    if (msg.type === 'ready') setReady(true);
    else if (msg.type === 'press' && onMarkerPress) onMarkerPress(msg.id);
  }, [onMarkerPress]);

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html, baseUrl: BASE_URL }}
        onMessage={onMessage}
        onLoadStart={() => setReady(false)}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled={showLocate}
        setSupportMultipleWindows={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#e5e7eb' },
  web:  { flex: 1, backgroundColor: 'transparent' },
});
