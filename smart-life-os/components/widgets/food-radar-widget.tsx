"use client";

import { useEffect, useMemo, useState } from "react";
import type { FoodPlace } from "@/lib/types";

const filters = ["All", "Yakiniku", "Shabu", "Sukiyaki", "Isaan", "Buffet"] as const;

type Filter = (typeof filters)[number];

export function FoodRadarWidget() {
  const [places, setPlaces] = useState<FoodPlace[]>([]);
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      const response = await fetch("/api/places?lat=13.7563&lon=100.5018");
      const data = (await response.json()) as { places: FoodPlace[] };
      if (!cancelled) setPlaces(data.places);
    }

    void loadPlaces();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPlaces = useMemo(() => {
    return filter === "All" ? places : places.filter((place) => place.type === filter);
  }, [filter, places]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
              filter === item ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-500"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {filteredPlaces.map((place) => (
          <div key={place.id} className="metric-card rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{place.name}</p>
                <p className="mt-1 text-xs text-slate-400">{place.type} · {place.distanceKm.toFixed(1)} km · ★ {place.rating}</p>
              </div>
              <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${place.openNow ? "bg-emerald-300 text-slate-950" : "bg-rose-400/15 text-rose-100"}`}>
                {place.openNow ? "OPEN" : "CLOSED"}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-300">เวลาเปิด: {place.hours}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {place.cardPromotions.map((promo) => (
                <span key={promo} className="rounded-md border border-violet-300/20 bg-violet-300/10 px-2 py-1 text-[10px] text-violet-100">
                  {promo}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
