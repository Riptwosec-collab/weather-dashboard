import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { LAYERS_LIST, LAYER_ICONS, hasOwmApiKey } from '../utils/helpers';
import type { LayerId } from '../types';

const OWM_LAYERS: LayerId[] = ['wind', 'temp', 'pressure', 'clouds', 'precip'];
const SOON_LAYERS: LayerId[] = ['waves'];
const RAINVIEWER_LAYERS: LayerId[] = ['radar', 'satellite', 'storms'];
const RADAR_LAYERS: LayerId[] = ['radar', 'storms'];

type LayerStatus = {
  label: 'LIVE' | 'API KEY' | 'NO DATA' | 'SOON';
  className: string;
  disabled: boolean;
  title: string;
};

function getLayerStatus(layer: LayerId, rainviewerTs: string | null, satelliteTs: string | null): LayerStatus {
  const needsApiKey = OWM_LAYERS.includes(layer) && !hasOwmApiKey;
  const isSoon = SOON_LAYERS.includes(layer);
  const noRainviewerData =
    (RADAR_LAYERS.includes(layer) && !rainviewerTs) ||
    (layer === 'satellite' && !satelliteTs);

  if (needsApiKey) {
    return {
      label: 'API KEY',
      disabled: true,
      title: 'Requires VITE_OWM_API_KEY in Vercel Environment Variables',
      className: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20',
    };
  }

  if (isSoon) {
    return {
      label: 'SOON',
      disabled: true,
      title: 'This map layer is not implemented yet',
      className: 'text-neutral-400 bg-neutral-700/30 border-white/10',
    };
  }

  if (noRainviewerData) {
    return {
      label: 'NO DATA',
      disabled: true,
      title: 'Provider has no frame data for this layer right now',
      className: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
    };
  }

  return {
    label: 'LIVE',
    disabled: false,
    title: RAINVIEWER_LAYERS.includes(layer) ? 'Live radar provider available' : 'Layer available',
    className: 'text-green-300 bg-green-500/10 border-green-500/20',
  };
}

export default function LayerControls({ compact = false }: { compact?: boolean }) {
  const {
    activeLayers,
    toggleLayer,
    theme,
    toggleTheme,
    rainviewerTs,
    satelliteTs,
  } = useWeatherStore();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${compact ? 'p-1 space-y-1' : 'p-1 space-y-0.5'}`}>
        {LAYERS_LIST.map((layer) => {
          const Icon = LAYER_ICONS[layer.id];
          const isActive = activeLayers.includes(layer.id);
          const status = getLayerStatus(layer.id, rainviewerTs, satelliteTs);
          const isDisabled = status.disabled;

          if (compact) {
            return (
              <button
                key={layer.id}
                title={`${layer.name} · ${status.label}`}
                disabled={isDisabled}
                onClick={() => !isDisabled && toggleLayer(layer.id)}
                className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                  isDisabled
                    ? 'opacity-35 cursor-not-allowed border-white/5 text-neutral-600 bg-black/20'
                    : isActive
                      ? 'bg-blue-600/20 border-blue-500/50 text-white'
                      : 'bg-black/30 border-white/10 text-neutral-500 hover:text-white hover:border-white/20'
                }`}
              >
                <Icon size={15} className={isActive && !isDisabled ? layer.color : ''} />
                {!isDisabled && isActive && <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                {isDisabled && <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-neutral-600" />}
              </button>
            );
          }

          return (
            <label
              key={layer.id}
              title={status.title}
              className={`flex items-center gap-2 p-2 transition-colors border-l-2 rounded-r ${
                isDisabled
                  ? 'opacity-45 cursor-not-allowed border-transparent text-neutral-500'
                  : isActive
                    ? 'bg-neutral-800/80 border-blue-500 text-white cursor-pointer'
                    : 'border-transparent text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={isActive && !isDisabled}
                disabled={isDisabled}
                onChange={() => !isDisabled && toggleLayer(layer.id)}
                className="appearance-none w-3 h-3 border border-neutral-600 rounded-sm
                           checked:bg-blue-500 focus:ring-0 cursor-pointer shrink-0
                           disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Icon size={14} className={isActive && !isDisabled ? layer.color : 'opacity-40'} />
              <span className="flex-1 text-[11px] truncate">{layer.name}</span>

              <span className={`text-[8px] font-mono border rounded px-1 py-0.5 shrink-0 ${status.className}`}>
                {status.label}
              </span>
              {isActive && !isDisabled && (
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              )}
            </label>
          );
        })}
      </div>

      {/* Footer: tile attribution + theme toggle */}
      {!compact && (
        <div className="p-2 border-t border-white/5 flex items-center justify-between gap-2">
          <p className="text-[9px] text-neutral-600 leading-relaxed">
            LIVE = ready · NO DATA = provider empty · API KEY = add VITE_OWM_API_KEY
          </p>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex items-center gap-1 text-[9px] text-neutral-500 hover:text-white
                       bg-neutral-800/60 hover:bg-neutral-700/60 border border-white/10
                       rounded px-2 py-1 transition-colors shrink-0"
          >
            {theme === 'dark'
              ? <><Sun size={10} /><span>Light</span></>
              : <><Moon size={10} /><span>Dark</span></>}
          </button>
        </div>
      )}
    </div>
  );
}
