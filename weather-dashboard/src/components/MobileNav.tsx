import React from 'react';
import { Layers, Eye, Clock } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import type { MobilePanel } from '../types';

const TABS: { id: MobilePanel; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'layers',   label: 'Layers',   icon: Layers },
  { id: 'analysis', label: 'Analysis', icon: Eye },
  { id: 'timeline', label: 'Timeline', icon: Clock },
];

export default function MobileNav() {
  const { mobilePanel, setMobilePanel } = useWeatherStore();

  return (
    <nav className="mobile-nav-shell flex pointer-events-auto safe-area-pb">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setMobilePanel(id)}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[9px] font-medium transition-colors ${
            mobilePanel === id ? 'text-[color:var(--accent)]' : 'text-neutral-600 hover:text-neutral-400'
          }`}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </nav>
  );
}
