// HTML page that runs inside the WebView for <LeafletMap>.
// Same free map as the MaxSeat website: Leaflet + OpenStreetMap tiles (with backup servers).
// No Google Maps API key needed.

const LEAFLET_VERSION = '1.9.4';

export function buildMapHtml({ baseUrl, interactive = true, showLocate = false, center, zoom }) {
  const assets = (file) => JSON.stringify([
    `${baseUrl}/static/vendor/leaflet/${file}`,                      // our own server first
    `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/${file}`,
    `https://cdn.jsdelivr.net/npm/leaflet@${LEAFLET_VERSION}/dist/${file}`,
  ]);
  const opts = JSON.stringify({ interactive, showLocate, center: center || [8.4822, 124.6472], zoom: zoom || 13 });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #e5e7eb; }
  body { font-family: -apple-system, Roboto, "Segoe UI", sans-serif; -webkit-tap-highlight-color: transparent; }
  #msg { position: absolute; inset: 0; display: none; align-items: center; justify-content: center;
         text-align: center; padding: 20px; color: #64748b; font-size: 14px; background: #f8fafc; z-index: 9999; }
  .ms-pop { min-width: 170px; max-width: 230px; }
  .ms-title { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
  .ms-line { font-size: 12px; color: #475569; margin-top: 2px; }
  .ms-line.warn { color: #d97706; font-weight: 700; }
  .ms-line.bad  { color: #dc2626; font-weight: 700; }
  .ms-nogps { font-size: 11px; color: #64748b; margin-top: 6px; }
  .ms-cta { display: block; margin-top: 10px; padding: 9px 10px; border-radius: 10px; background: #2563eb;
            color: #fff; font-size: 13px; font-weight: 800; text-align: center; }
  .leaflet-container a.ms-cta, .leaflet-container a.ms-cta:visited { color: #fff; text-decoration: none; }
  .leaflet-container a.ms-btn { color: #0f172a; }
  .ms-btn { display: block; width: 36px; height: 36px; line-height: 34px; text-align: center; background: #fff;
            color: #0f172a; font-size: 18px; font-weight: 700; text-decoration: none; }
  .leaflet-popup-content { margin: 12px 14px; }
</style>
</head>
<body>
<div id="map"></div>
<div id="msg">The map couldn't load. Check your internet connection.</div>
<script>
(function () {
  var OPTS = ${opts};
  var CSS = ${assets('leaflet.css')};
  var JS  = ${assets('leaflet.js')};

  function post(m) { try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {} }
  function fail(why) { document.getElementById('msg').style.display = 'flex'; post({ type: 'error', message: why }); }

  function loadCss(i) {
    if (i >= CSS.length) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = CSS[i];
    l.onerror = function () { l.remove(); loadCss(i + 1); };
    document.head.appendChild(l);
  }
  function loadJs(i) {
    if (i >= JS.length) { fail('leaflet'); return; }
    var s = document.createElement('script'); s.src = JS[i];
    s.onload = function () { if (window.L) start(); else loadJs(i + 1); };
    s.onerror = function () { s.remove(); loadJs(i + 1); };
    document.head.appendChild(s);
  }

  // Free map backgrounds, no API key (CARTO now watermarks its free tiles).
  // If one server fails, the map switches to the next.
  var TILES = [
    { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      o: { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' } },
    { url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      o: { subdomains: 'abc', maxZoom: 19, attribution: '&copy; OpenStreetMap contributors, HOT' } },
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      o: { maxZoom: 19, attribution: 'Tiles &copy; Esri' } }
  ];

  function toLL(lat, lng) {
    var a = parseFloat(lat), b = parseFloat(lng);
    if (!isFinite(a) || !isFinite(b) || Math.abs(a) > 90 || Math.abs(b) > 180) return null;
    if (Math.abs(a) < 0.001 && Math.abs(b) < 0.001) return null;      // 0,0 = GPS has no fix
    return [a, b];
  }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var map, layer = {}, ids = '', fitted = false, current = [];

  function tracked(m) { return m.hasGps !== false && !!toLL(m.lat, m.lng); }
  function pos(m) { return toLL(m.lat, m.lng) || OPTS.center; }
  function style(m) {
    var r = m.radius || 11;
    return tracked(m)
      ? { radius: r, fillColor: m.color || '#2563eb', color: '#fff', weight: 3, fillOpacity: 1, opacity: 1, dashArray: null }
      : { radius: r - 2, fillColor: '#94a3b8', color: '#475569', weight: 2, fillOpacity: 0.55, opacity: 0.9, dashArray: '3 3' };
  }
  function popup(m) {
    var h = '<div class="ms-pop"><div class="ms-title">' + esc(m.title) + '</div>';
    (m.lines || []).forEach(function (ln) {
      var t = typeof ln === 'string' ? { text: ln } : ln;
      h += '<div class="ms-line ' + esc(t.tone || '') + '">' + esc(t.text) + '</div>';
    });
    if (!tracked(m)) h += '<div class="ms-nogps">No GPS fix yet, shown at CDO center</div>';
    if (m.cta) h += '<a class="ms-cta" href="#" data-id="' + esc(m.id) + '">' + esc(m.cta) + '</a>';
    return h + '</div>';
  }

  function fit(list) {
    var pts = (list || current).filter(tracked).map(pos);
    if (!pts.length) map.setView(OPTS.center, OPTS.zoom);
    else if (pts.length === 1) map.setView(pts[0], 16);
    else map.fitBounds(pts, { padding: [48, 48], maxZoom: 16 });
  }

  // Called from React Native with the full marker list each time data changes
  function setMarkers(list) {
    current = list || [];
    var seen = {};
    current.forEach(function (m) {
      var k = String(m.id); seen[k] = true;
      if (layer[k]) {
        layer[k].setLatLng(pos(m)).setStyle(style(m)).setPopupContent(popup(m));
      } else {
        layer[k] = L.circleMarker(pos(m), style(m)).addTo(map).bindPopup(popup(m));
      }
    });
    Object.keys(layer).forEach(function (k) { if (!seen[k]) { map.removeLayer(layer[k]); delete layer[k]; } });
    var now = current.map(function (m) { return m.id; }).join(',');
    if (!fitted || now !== ids) { fit(current); fitted = true; }   // first load, or vehicles added/removed
    ids = now;
  }

  function control(html, title, onClick) {
    var C = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        var a = L.DomUtil.create('a', 'leaflet-bar ms-btn');
        a.href = '#'; a.title = title; a.innerHTML = html;
        L.DomEvent.disableClickPropagation(a);
        L.DomEvent.on(a, 'click', function (e) { L.DomEvent.preventDefault(e); onClick(); });
        return a;
      }
    });
    map.addControl(new C());
  }

  function start() {
    var I = OPTS.interactive;
    map = L.map('map', {
      center: OPTS.center, zoom: OPTS.zoom, zoomControl: I, attributionControl: true,
      dragging: I, touchZoom: I, doubleClickZoom: I, scrollWheelZoom: I, boxZoom: I, keyboard: I, tap: false
    });
    map.attributionControl.setPrefix(false);

    var idx = 0, tl = null, ok = 0, bad = 0;
    function useTiles(i) {
      if (tl) map.removeLayer(tl);
      idx = i; ok = 0; bad = 0;
      tl = L.tileLayer(TILES[i].url, TILES[i].o).addTo(map);
      tl.on('tileload', function () { ok++; });
      tl.on('tileerror', function () { bad++; if (ok === 0 && bad >= 4 && idx + 1 < TILES.length) useTiles(idx + 1); });
    }
    useTiles(0);

    if (I) control('&#x2922;', 'Show all', function () { fit(); });
    if (I && OPTS.showLocate) {
      var me = null;
      control('&#x25CE;', 'My location', function () {
        if (!navigator.geolocation) { post({ type: 'locate-failed' }); return; }
        navigator.geolocation.getCurrentPosition(function (p) {
          var ll = [p.coords.latitude, p.coords.longitude];
          if (me) me.setLatLng(ll);
          else me = L.circleMarker(ll, { radius: 8, fillColor: '#3b82f6', color: '#fff', weight: 3, fillOpacity: 1 }).addTo(map);
          map.setView(ll, 16);
        }, function () { post({ type: 'locate-failed' }); }, { enableHighAccuracy: true, timeout: 10000 });
      });
    }

    // "View details" / "Respond" button inside a popup
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('.ms-cta') : null;
      if (t) { e.preventDefault(); post({ type: 'press', id: t.getAttribute('data-id') }); }
    });

    window.addEventListener('resize', function () { map.invalidateSize(); });
    setTimeout(function () { map.invalidateSize(); }, 300);

    window.MS = { setMarkers: setMarkers, fit: fit };
    post({ type: 'ready' });
  }

  loadCss(0);
  loadJs(0);
})();
</script>
</body>
</html>`;
}
