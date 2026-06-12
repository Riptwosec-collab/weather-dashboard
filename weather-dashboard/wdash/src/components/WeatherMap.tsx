import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Source, Layer, Marker, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LocateFixed, Share2, Check } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { buildOverlayLayers, clickedLocationLabel, reverseGeocodeName } from '../utils/helpers';
import { useShareableUrl } from '../hooks/useShareableUrl';
import { ErrorBoundary } from './ErrorBoundary';

const MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE ??
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

function WeatherMapInner() {
  const {
    setSelectedLocation,
    activeLayers,
    rainviewerTs,
    satelliteTs,
    selectedLocation,
    locationName,
  } = useWeatherStore();

  const [lat, lng] = selectedLocation;
  const [hud, setHud]           = useState({ show: false, x: 0, y: 0, lat: '0', lng: '0' });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError]   = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);

  const mapRef = useRef<MapRef>(null);
  const clickRequestRef = useRef(0);
  const { copyShareLink } = useShareableUrl();

  // ── Fly to new location whenever selectedLocation changes ──
  const prevLocationRef = useRef<[number, number] | null>(null);
  useEffect(() => {
    const prev = prevLocationRef.current;
    prevLocationRef.current = [lat, lng];
    if (!prev) return; // skip on mount — map already starts at the right place
    if (prev[0] === lat && prev[1] === lng) return;

    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 8,
      duration: 1400,
      essential: true,
    });
  }, [lat, lng]);

  const onMouseMove = useCallback((e: {
    point: { x: number; y: number };
    lngLat: { lat: number; lng: number };
  }) => {
    setHud({ show: true, x: e.point.x, y: e.point.y,
             lat: e.lngLat.lat.toFixed(4), lng: e.lngLat.lng.toFixed(4) });
  }, []);

  const selectMapLocation = useCallback(async (latValue: number, lngValue: number) => {
    const requestId = ++clickRequestRef.current;
    setGeoError(null);
    setSelectedLocation(latValue, lngValue, clickedLocationLabel(latValue, lngValue));

    const resolvedName = await reverseGeocodeName(latValue, lngValue);
    if (clickRequestRef.current !== requestId) return;
    setSelectedLocation(latValue, lngValue, resolvedName);
  }, [setSelectedLocation]);

  const handleAutoLocate = useCallback(() => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported'); return; }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nextLat = pos.coords.latitude;
        const nextLng = pos.coords.longitude;
        setSelectedLocation(nextLat, nextLng, 'My Location');
        const resolvedName = await reverseGeocodeName(nextLat, nextLng);
        setSelectedLocation(nextLat, nextLng, resolvedName === clickedLocationLabel(nextLat, nextLng) ? 'My Location' : resolvedName);
        setGeoLoading(false);
      },
      (err) => { setGeoError(err.message); setGeoLoading(false); },
      { timeout: 10_000 }
    );
  }, [setSelectedLocation]);

  const handleShare = useCallback(async () => {
    try {
      await copyShareLink();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }, [copyShareLink]);

  const { sources, layers } = buildOverlayLayers(activeLayers, rainviewerTs, satelliteTs);

  return (
    <div className="w-full h-full relative cursor-crosshair">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: lng, latitude: lat, zoom: 5 }}
        mapStyle={MAP_STYLE}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHud((p) => ({ ...p, show: false }))}
        onClick={(e) => selectMapLocation(e.lngLat.lat, e.lngLat.lng)}
        interactiveLayerIds={[]}
      >
        {/* ── tile overlays ── */}
        {sources.map((src) => (
          <Source
            key={src.id}
            id={src.id}
            type="raster"
            tiles={src.tiles}
            tileSize={src.tileSize ?? 256}
            minzoom={src.minzoom}
            maxzoom={src.maxzoom}
            attribution={src.attribution}
          >
            {layers.filter((l) => l.source === src.id).map((l) => (
              <Layer key={l.id} id={l.id} type="raster"
                     paint={l.paint as Record<string, unknown>} />
            ))}
          </Source>
        ))}

        {/* ── selected location marker ── */}
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <div className="flex flex-col items-center pointer-events-none select-none">
            <div className="bg-neutral-900/90 border border-blue-500/60 text-[9px] text-white
                            px-1.5 py-0.5 rounded shadow-lg mb-0.5 max-w-[160px] truncate text-center">
              {locationName}
            </div>
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg
                              flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full
                              w-0.5 h-2 bg-blue-500" />
            </div>
          </div>
        </Marker>
      </Map>

      {/* ── coordinate HUD ── */}
      {hud.show && (
        <div
          className="absolute z-10 bg-black/90 border border-neutral-700 text-[10px] p-1.5
                     rounded pointer-events-none text-green-400 font-mono shadow-2xl backdrop-blur-sm"
          style={{ top: hud.y + 15, left: hud.x + 15 }}
        >
          LAT: {hud.lat}<br />LNG: {hud.lng}
        </div>
      )}

      {/* ── action buttons ── */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
        {geoError && (
          <div className="text-[9px] text-red-400 bg-black/70 rounded px-2 py-1 max-w-[160px] text-right">
            {geoError}
          </div>
        )}

        {/* Share button */}
        <button
          onClick={handleShare}
          title="Copy share link"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-900/90
                     border border-white/20 shadow-lg hover:bg-neutral-800 transition-colors"
        >
          {copied
            ? <Check size={15} className="text-green-400" />
            : <Share2 size={15} className="text-neutral-300" />}
        </button>

        {/* Auto-locate button */}
        <button
          onClick={handleAutoLocate}
          disabled={geoLoading}
          title="Use my location"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-900/90
                     border border-white/20 shadow-lg hover:bg-neutral-800 transition-colors
                     disabled:opacity-50"
        >
          {geoLoading
            ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            : <LocateFixed size={16} className="text-blue-400" />}
        </button>
      </div>

      {/* ── crosshair ── */}
      <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-white/20 rounded-full
                      -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-red-500 rounded-full
                      -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export default function WeatherMap() {
  return (
    <ErrorBoundary fallbackLabel="Map failed to load">
      <WeatherMapInner />
    </ErrorBoundary>
  );
}
