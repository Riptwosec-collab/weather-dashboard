import React from 'react';
import { Layer } from 'react-map-gl/maplibre';

const COUNTRY_FILTER = ['all', ['==', 'admin_level', 2], ['!=', 'maritime', 1]] as any;
const PROVINCE_FILTER = ['all', ['==', 'admin_level', 4], ['!=', 'maritime', 1]] as any;
const DISTRICT_FILTER = ['all', ['==', 'admin_level', 6], ['!=', 'maritime', 1]] as any;

const roundedLine = {
  'line-cap': 'round',
  'line-join': 'round',
} as any;

export default function AdminBoundaryLayers() {
  return (
    <>
      {/* Country border: distinct magenta/purple so it never blends with province or district lines */}
      <Layer
        id="admin-country-glow"
        type="line"
        source="carto"
        source-layer="boundary"
        filter={COUNTRY_FILTER}
        layout={roundedLine}
        paint={{
          'line-color': '#f0abfc',
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 5.5, 6, 7, 10, 9.5],
          'line-opacity': 0.24,
          'line-blur': 4.8,
        } as any}
      />
      <Layer
        id="admin-country-line"
        type="line"
        source="carto"
        source-layer="boundary"
        filter={COUNTRY_FILTER}
        layout={roundedLine}
        paint={{
          'line-color': '#e879f9',
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.35, 6, 2.1, 10, 3.1],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.94, 8, 0.82, 11, 0.72],
        } as any}
      />
      <Layer
        id="admin-country-accent"
        type="line"
        source="carto"
        source-layer="boundary"
        filter={COUNTRY_FILTER}
        layout={roundedLine}
        paint={{
          'line-color': '#fdf4ff',
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.28, 6, 0.45, 10, 0.75],
          'line-opacity': 0.82,
          'line-dasharray': [5.5, 1.8],
        } as any}
      />

      {/* Province border: readable but softer than country border */}
      <Layer
        id="admin-province-glow"
        type="line"
        source="carto"
        source-layer="boundary"
        filter={PROVINCE_FILTER}
        layout={roundedLine}
        paint={{
          'line-color': '#22d3ee',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.5, 7, 2.2, 10, 3.4],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.12, 6, 0.18, 10, 0.24],
          'line-blur': 2.2,
        } as any}
      />
      <Layer
        id="admin-province-line"
        type="line"
        source="carto"
        source-layer="boundary"
        filter={PROVINCE_FILTER}
        layout={roundedLine}
        paint={{
          'line-color': '#67e8f9',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.55, 7, 0.95, 10, 1.6],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.38, 6, 0.55, 10, 0.72],
        } as any}
      />

      {/* District border: only becomes obvious at useful city-level zooms */}
      <Layer
        id="admin-district-glow"
        type="line"
        source="carto"
        source-layer="boundary"
        filter={DISTRICT_FILTER}
        layout={roundedLine}
        paint={{
          'line-color': '#fef3c7',
          'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.8, 9, 1.4, 12, 2.2],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0, 8, 0.08, 10, 0.16, 12, 0.24],
          'line-blur': 1.5,
        } as any}
      />
      <Layer
        id="admin-district-line"
        type="line"
        source="carto"
        source-layer="boundary"
        filter={DISTRICT_FILTER}
        layout={roundedLine}
        paint={{
          'line-color': '#fbbf24',
          'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.2, 9, 0.45, 12, 0.9],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0, 8, 0.18, 10, 0.32, 12, 0.52],
          'line-dasharray': [1.2, 1.8],
        } as any}
      />
    </>
  );
}
