"use client";

import { ExternalLink, RotateCcw } from "lucide-react";
import { useDashboardStore } from "@/store/dashboard-store";

export function AppHeader() {
  const done = useDashboardStore((state) => state.onboardingCompleted);
  const profile = useDashboardStore((state) => state.profile);
  const resetDashboard = useDashboardStore((state) => state.resetDashboard);

  return (
    <header className="glass-panel rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase text-cyan-100">
            Smart Life OS
          </p>
          <h1 className="max-w-4xl text-3xl font-bold text-white sm:text-5xl">
            Personal dashboard for weather, food, market, and IT tools
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            Thai-first modular widgets with one affiliate purchase link and AI briefing.
          </p>
          <a
            className="sharp-button mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition"
            href="/weather-dashboard/"
          >
            <ExternalLink size={16} />
            Open Weather Dashboard
          </a>
        </div>
        {done ? (
          <div className="ui-panel rounded-lg p-4 text-sm text-slate-200 lg:min-w-56">
            <p className="text-xs font-semibold uppercase text-amber-200">Profile</p>
            <p className="mt-1 font-semibold text-white">{profile?.province ?? "Bangkok"}</p>
            <p className="text-slate-400">Role: {profile?.role ?? "balanced"}</p>
            <button
              className="ghost-button mt-3 inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold transition"
              onClick={resetDashboard}
              type="button"
            >
              <RotateCcw size={14} />
              Reset dashboard
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
