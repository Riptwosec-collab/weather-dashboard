import React, { useEffect, useRef, lazy, Suspense, useState } from 'react';
import { Layers, Eye, Clock, Keyboard, ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { useWeatherStore } from './store/weatherStore';
import { useShareableUrl } from './hooks/useShareableUrl';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ErrorBoundary } from './components/ErrorBoundary';
import MobileNav from './components/MobileNav';
import LayerControls from './components/LayerControls';
import type { Theme } from './types';

const WeatherMap      = lazy(() => import('./components/WeatherMap'));
const MeteogramPanel  = lazy(() => import('./components/MeteogramPanel'));
const TimelineConsole = lazy(() => import('./components/TimelineConsole'));

function PanelSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PanelHeader({
  icon: Icon, label, badge,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="px-3 py-2.5 border-b border-white/10 font-bold tracking-wider text-neutral-400
                    uppercase text-[10px] flex items-center gap-1.5 justify-between shrink-0">
      <span className="flex items-center gap-1.5 min-w-0"><Icon size={11} />{label && <span className="truncate">{label}</span>}</span>
      {badge}
    </div>
  );
}

const LiveBadge = () => (
  <span className="text-green-400/80 flex items-center gap-1 text-[9px] normal-case
                   font-normal tracking-normal">
    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
  </span>
);

const THEME_OPTIONS: Array<{ id: Theme; label: string; color: string }> = [
  { id: 'ocean', label: 'Ocean', color: 'bg-sky-400' },
  { id: 'light', label: 'Light', color: 'bg-slate-100' },
  { id: 'graphite', label: 'Graphite', color: 'bg-zinc-500' },
  { id: 'aurora', label: 'Aurora', color: 'bg-teal-400' },
  { id: 'violet', label: 'Violet', color: 'bg-violet-500' },
  { id: 'ember', label: 'Ember', color: 'bg-orange-400' },
  { id: 'dark', label: 'Night', color: 'bg-slate-950' },
];

// ── Onboarding tooltip ────────────────────────────────────────
function OnboardingToast() {
  const { showOnboarding, dismissOnboarding } = useWeatherStore();
  if (!showOnboarding) return null;
  return (
    <div className="wd-panel absolute bottom-48 left-1/2 z-30 max-w-[280px] -translate-x-1/2 rounded-lg p-3 pointer-events-auto">
      <div className="text-[11px] text-white font-semibold mb-1">Welcome to Weather Dashboard</div>
      <ul className="text-[9px] text-neutral-400 space-y-0.5 mb-2">
        <li>🖱 <strong>Click map</strong> to select any location</li>
        <li>🔍 <strong>Search</strong> for a city in the Analysis panel</li>
        <li>🔖 <strong>Bookmark</strong> up to 5 favourite cities</li>
        <li>📊 Switch tabs: Current · 7-Day · AQI · Compare</li>
        <li className="flex items-center gap-1">
          <Keyboard size={8} />
          <strong>/</strong> search · <strong>L</strong> layers · <strong>U</strong> unit · <strong>S</strong> share
        </li>
      </ul>
      <button
        onClick={dismissOnboarding}
        className="w-full text-[9px] bg-blue-600 hover:bg-blue-500 text-white
                   rounded py-1 transition-colors"
      >
        Got it
      </button>
    </div>
  );
}

// ── Keyboard shortcut hint badge ──────────────────────────────
function ShortcutHint() {
  return (
    <div className="wd-control absolute top-3 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded px-2 py-1 font-mono text-[8px] text-neutral-400 pointer-events-none md:flex">
      <Keyboard size={8} />
      <kbd>/</kbd> search · <kbd>L</kbd> layers · <kbd>T</kbd> timeline · <kbd>U</kbd> unit · <kbd>S</kbd> share
    </div>
  );
}

function ThemeDock() {
  const { theme, setTheme } = useWeatherStore();

  return (
    <div className="theme-dock absolute right-4 top-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-lg px-3 py-2 pointer-events-auto">
      <div className="flex min-w-[132px] items-center gap-2 pr-2 text-[10px] font-black uppercase tracking-wider text-[color:var(--text-strong)]">
        <Palette size={14} className="text-[color:var(--accent)]" />
        <div className="leading-tight">
          <div>Premium Theme</div>
          <div className="font-mono text-[9px] text-[color:var(--accent)]">LIVE UI v2.3</div>
        </div>
      </div>
      <div className="theme-dock-divider" />
      <div className="flex items-center gap-1 overflow-x-auto">
        {THEME_OPTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTheme(item.id)}
            title={`Switch to ${item.label} theme`}
            aria-label={`Switch to ${item.label} theme`}
            className={`theme-dock-button ${theme === item.id ? 'theme-dock-button-active' : ''}`}
          >
            <span className={`h-3 w-3 rounded-full border border-white/35 ${item.color}`} />
            <span className="hidden lg:inline">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
function VisualRefreshBadge() {
  return (
    <div className="visual-refresh-badge absolute left-[252px] top-4 z-30 hidden rounded-lg px-3 py-2 pointer-events-none md:block">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--accent)]">New Premium UI v2.3</div>
      <div className="text-[9px] text-[color:var(--text-soft)]">Theme switcher moved to top-right. Radar softened.</div>
    </div>
  );
}

export default function App() {
  const { fetchRainviewerTs, mobilePanel, theme, setTheme } = useWeatherStore();
  const [layersCollapsed, setLayersCollapsed] = useState(false);

  // Shareable URL sync (reads params on mount, writes on change)
  useShareableUrl();

  // Search input ref for / shortcut
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const focusSearch = () => {
    const el = document.querySelector<HTMLInputElement>('input[placeholder*="Search city"]');
    el?.focus();
  };
  useKeyboardShortcuts(focusSearch);

  useEffect(() => {
    const versionKey = 'weather-dashboard-ui-v23';
    if (localStorage.getItem(versionKey)) return;
    setTheme('ocean');
    localStorage.setItem(versionKey, '1');
  }, [setTheme]);

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // RainViewer polling
  useEffect(() => {
    fetchRainviewerTs();
    const id = setInterval(fetchRainviewerTs, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchRainviewerTs]);

  return (
    <div className="wd-root h-screen w-screen overflow-hidden text-neutral-200 font-sans text-xs relative">

      {/* Map */}
      <div className="absolute inset-0 z-0">
        <ErrorBoundary fallbackLabel="Map failed to load">
          <Suspense fallback={<div className="w-full h-full bg-neutral-950" />}>
            <WeatherMap />
          </Suspense>
        </ErrorBoundary>
      </div>

      <ThemeDock />
      <VisualRefreshBadge />

      {/* ── DESKTOP ── */}
      <div className="hidden md:flex absolute inset-0 z-10 pointer-events-none p-4 gap-4 flex-col">
        <div className="flex flex-1 gap-4 min-h-0">
          <aside className={`${layersCollapsed ? 'w-14' : 'w-56'} wd-panel flex flex-col rounded-lg pointer-events-auto overflow-hidden transition-all duration-300`}>
            <PanelHeader
              icon={Layers}
              label={layersCollapsed ? '' : 'Data Layers'}
              badge={
                <button
                  onClick={() => setLayersCollapsed((v) => !v)}
                  title={layersCollapsed ? 'Expand layers' : 'Collapse layers'}
                  className="wd-control flex h-6 w-6 items-center justify-center rounded text-neutral-300 transition-colors hover:border-cyan-300/50 hover:text-white"
                >
                  {layersCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
                </button>
              }
            />
            <ErrorBoundary><LayerControls compact={layersCollapsed} /></ErrorBoundary>
          </aside>

          <aside className="wd-panel flex w-80 flex-col rounded-lg pointer-events-auto overflow-hidden">
            <PanelHeader icon={Eye} label="Location Analysis" badge={<LiveBadge />} />
            <ErrorBoundary>
              <Suspense fallback={<PanelSkeleton />}>
                <MeteogramPanel />
              </Suspense>
            </ErrorBoundary>
          </aside>
        </div>

        <div className="wd-panel flex h-40 shrink-0 flex-col rounded-lg pointer-events-auto overflow-hidden">
          <PanelHeader icon={Clock} label="Timeline Forecast" badge={<LiveBadge />} />
          <ErrorBoundary>
            <Suspense fallback={<PanelSkeleton />}>
              <TimelineConsole />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="flex md:hidden absolute inset-0 z-10 pointer-events-none flex-col justify-end">
        <div className="wd-panel flex h-[58vh] flex-col overflow-hidden border-x-0 border-b-0 pointer-events-auto">
          {mobilePanel === 'layers' && (
            <><PanelHeader icon={Layers} label="Data Layers" />
              <ErrorBoundary><LayerControls /></ErrorBoundary></>
          )}
          {mobilePanel === 'analysis' && (
            <><PanelHeader icon={Eye} label="Location Analysis" badge={<LiveBadge />} />
              <ErrorBoundary><Suspense fallback={<PanelSkeleton />}><MeteogramPanel /></Suspense></ErrorBoundary></>
          )}
          {mobilePanel === 'timeline' && (
            <><PanelHeader icon={Clock} label="Timeline" badge={<LiveBadge />} />
              <ErrorBoundary><Suspense fallback={<PanelSkeleton />}><TimelineConsole /></Suspense></ErrorBoundary></>
          )}
        </div>
        <MobileNav />
      </div>

      {/* Onboarding */}
      <div className="absolute inset-0 z-20 pointer-events-none flex items-end justify-center pb-2">
        <OnboardingToast />
      </div>
    </div>
  );
}
