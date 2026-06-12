import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { LAYERS_LIST, LAYER_ICONS } from '../utils/helpers';

export default function LayerControls() {
  const { activeLayers, toggleLayer, theme, toggleTheme } = useWeatherStore();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
        {LAYERS_LIST.map((layer) => {
          const Icon = LAYER_ICONS[layer.id];
          const isActive = activeLayers.includes(layer.id);
          return (
            <label
              key={layer.id}
              className={`flex items-center gap-2 p-2 cursor-pointer transition-colors border-l-2 rounded-r ${
                isActive
                  ? 'bg-neutral-800/80 border-blue-500 text-white'
                  : 'border-transparent text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => toggleLayer(layer.id)}
                className="appearance-none w-3 h-3 border border-neutral-600 rounded-sm
                           checked:bg-blue-500 focus:ring-0 cursor-pointer shrink-0"
              />
              <Icon size={14} className={isActive ? layer.color : 'opacity-40'} />
              <span className="flex-1 text-[11px] truncate">{layer.name}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              )}
            </label>
          );
        })}
      </div>

      {/* Footer: tile attribution + theme toggle */}
      <div className="p-2 border-t border-white/5 flex items-center justify-between gap-2">
        <p className="text-[9px] text-neutral-600 leading-relaxed">
          Radar: RainViewer · Wind/Temp: OWM
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
