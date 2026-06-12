import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { LAYERS_LIST, LAYER_ICONS, hasOwmApiKey } from '../utils/helpers';
import type { LayerId } from '../types';

const OWM_LAYERS: LayerId[] = ['wind', 'temp', 'pressure', 'clouds', 'precip'];
const SOON_LAYERS: LayerId[] = ['waves'];
const RAINVIEWER_LAYERS: LayerId[] = ['radar', 'satellite', 'storms'];

export default function LayerControls() {
  const { activeLayers, toggleLayer, theme, toggleTheme } = useWeatherStore();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
        {LAYERS_LIST.map((layer) => {
          const Icon = LAYER_ICONS[layer.id];
          const isActive = activeLayers.includes(layer.id);
          const needsApiKey = OWM_LAYERS.includes(layer.id) && !hasOwmApiKey;
          const isSoon = SOON_LAYERS.includes(layer.id);
          const isRainviewer = RAINVIEWER_LAYERS.includes(layer.id);
          const isDisabled = needsApiKey || isSoon;

          return (
            <label
              key={layer.id}
              title={
                needsApiKey
                  ? 'Requires VITE_OWM_API_KEY in Vercel Environment Variables'
                  : isSoon
                    ? 'This map layer is not implemented yet'
                    : layer.name
              }
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

              {needsApiKey && (
                <span className="text-[8px] font-mono text-yellow-300 bg-yellow-500/10
                                 border border-yellow-500/20 rounded px-1 py-0.5 shrink-0">
                  API KEY
                </span>
              )}
              {isRainviewer && !isDisabled && (
                <span className="text-[8px] font-mono text-blue-300 bg-blue-500/10
                                 border border-blue-500/20 rounded px-1 py-0.5 shrink-0">
                  RADAR
                </span>
              )}
              {isSoon && (
                <span className="text-[8px] font-mono text-neutral-400 bg-neutral-700/30
                                 border border-white/10 rounded px-1 py-0.5 shrink-0">
                  SOON
                </span>
              )}
              {isActive && !isDisabled && (
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              )}
            </label>
          );
        })}
      </div>

      {/* Footer: tile attribution + theme toggle */}
      <div className="p-2 border-t border-white/5 flex items-center justify-between gap-2">
        <p className="text-[9px] text-neutral-600 leading-relaxed">
          Radar/Satellite: RainViewer · Weather cards: Open-Meteo · OWM overlays need API key
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
    </div>
  );
}
