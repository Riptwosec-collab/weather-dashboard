import React from 'react';
import { Layer } from 'react-map-gl/maplibre';

const PROVINCE_FILTER = ['all', ['==', 'admin_level', 4], ['!=', 'maritime', 1]] as any;
const DISTRICT_FILTER = ['all', ['==', 'admin_level', 6], ['!=', 'maritime', 1]] as any;

export default function AdminBoundaryLayers() {
  return (
    <>
      <Layer
        id="admin-province-glow"
        type="line"
        source="carto"
        source-layer="boundary"
        filter={PROVINCE_FILTER}
        paint={{
          'line-color': '#22d3ee',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 2.2, 7, 3.2, 10, 5],
          'line-opacity': 0.28,
          'line-blur': 3,
        } as any}
      />
      <Layer
        id="admin-province-line"
        type="line"
        source="carto"
        source-layer="boundary"
        filter={PROVINCE_FILTER}
        paint={{
          'line-color': '#38bdf8',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.9, 7, 1.5, 10, 2.6],
          'line-opacity': 0.85,
        } as any}
      />
      <Layer
        id="admin-district-glow"
        type="line"
        source="carto"
        source-layer="boundary"
        filter={DISTRICT_FILTER}
        paint={{
          'line-color': '#facc15',
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1.2, 9, 2, 12, 3],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0, 7, 0.16, 10, 0.28],
          'line-blur': 2,
        } as any}
      />
      <Layer
        id="admin-district-line"
        type="line"
        source="carto"
        source-layer="boundary"
        filter={DISTRICT_FILTER}
        paint={{
          'line-color': '#fde68a',
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.35, 9, 0.75, 12, 1.25],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0, 7, 0.35, 10, 0.58],
          'line-dasharray': [1.4, 1.4],
        } as any}
      />
    </>
  );
}
