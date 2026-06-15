"use client";

import { useDashboardStore } from "@/store/dashboard-store";

export function AppHeader() {
  const done = useDashboardStore((state) => state.onboardingCompleted);
  const profile = useDashboardStore((state) => state.profile);
  const resetDashboard = useDashboardStore((state) => state.resetDashboard);

  return (
    <header className="glass-panel rounded-[2rem] p-5 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Smart Life OS
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Personal dashboard for weather, food, market, and IT tools
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base">
            Thai-first modular widgets with contextual affiliate cards and AI briefing.
          </p>
        </div>
        {done ? (
          <div className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Profile</p>
            <p className="mt-1 font-semibold text-white">{profile?.province ?? "Bangkok"}</p>
            <p className="text-slate-400">Role: {profile?.role ?? "balanced"}</p>
            <button
              className="mt-3 rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
              onClick={resetDashboard}
              type="button"
            >
              Reset dashboard
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
