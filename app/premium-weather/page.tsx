const dashboardUrl = "/weather-dashboard-v23?fresh=premium-route-v3";

export const metadata = {
  title: "Premium Weather v3 | Smart Life OS",
  description: "Cache-isolated premium weather dashboard route."
};

export default function PremiumWeatherPage() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <section className="flex min-h-screen flex-col">
        <header className="relative z-10 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-cyan-300/30 bg-cyan-950 px-5 py-4 shadow-[0_18px_50px_rgba(8,145,178,0.28)]">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">New Route Loaded</p>
            <h1 className="mt-1 text-2xl font-black tracking-normal text-white sm:text-3xl">
              PREMIUM WEATHER v3
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-emerald-300/40 bg-emerald-400/15 px-3 py-2 text-xs font-bold text-emerald-100">
              Cache isolated
            </span>
            <a
              className="rounded-md border border-white/20 bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-100"
              href={dashboardUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open direct
            </a>
          </div>
        </header>

        <div className="relative flex-1">
          <div className="absolute left-4 top-4 z-10 rounded-md border border-cyan-300/35 bg-slate-950/88 px-3 py-2 text-xs font-bold text-cyan-100 shadow-2xl">
            If this banner is visible, you are not seeing the old cached page.
          </div>
          <iframe
            title="Premium Weather Dashboard v23"
            src={dashboardUrl}
            className="h-[calc(100vh-80px)] w-full border-0"
          />
        </div>
      </section>
    </main>
  );
}
