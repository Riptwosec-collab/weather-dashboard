"use client";

import { useEffect, useMemo, useState } from "react";
import type { BuyLot, MarketAsset } from "@/lib/types";

export function MarketWidget() {
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [lots, setLots] = useState<BuyLot[]>([
    { id: "lot-1", units: 1, price: 100 },
    { id: "lot-2", units: 2, price: 120 }
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadMarket() {
      const response = await fetch("/api/market?symbols=BTCUSDT,ETHUSDT,NVDA,VOO");
      const data = (await response.json()) as { assets: MarketAsset[] };
      if (!cancelled) setAssets(data.assets);
    }

    void loadMarket();
    return () => {
      cancelled = true;
    };
  }, []);

  const averageCost = useMemo(() => {
    const totalUnits = lots.reduce((sum, lot) => sum + lot.units, 0);
    const totalCost = lots.reduce((sum, lot) => sum + lot.units * lot.price, 0);
    return totalUnits > 0 ? totalCost / totalUnits : 0;
  }, [lots]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {assets.map((asset) => (
          <div key={asset.symbol} className="metric-card rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{asset.symbol}</p>
                <p className="text-xs text-slate-400">{asset.name}</p>
              </div>
              <span className={asset.changePercent >= 0 ? "text-emerald-300" : "text-rose-300"}>
                {asset.changePercent.toFixed(2)}%
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-white">
              {asset.price.toLocaleString()} {asset.currency}
            </p>
          </div>
        ))}
      </div>

      <div className="metric-card rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">Average Cost Calculator</p>
            <p className="text-xs text-slate-400">คำนวณต้นทุนเฉลี่ยจากหลายไม้</p>
          </div>
          <button
            className="ghost-button px-3 py-2 text-xs font-semibold transition"
            type="button"
            onClick={() => setLots((items) => [...items, { id: crypto.randomUUID(), units: 1, price: 100 }])}
          >
            เพิ่มไม้
          </button>
        </div>
        <div className="mt-4 grid gap-2">
          {lots.map((lot) => (
            <div key={lot.id} className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
                min={0}
                type="number"
                value={lot.units}
                onChange={(event) => setLots((items) => items.map((item) => item.id === lot.id ? { ...item, units: Number(event.target.value) } : item))}
              />
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
                min={0}
                type="number"
                value={lot.price}
                onChange={(event) => setLots((items) => items.map((item) => item.id === lot.id ? { ...item, price: Number(event.target.value) } : item))}
              />
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm font-bold text-cyan-100">
          Average cost: {averageCost.toFixed(2)} ต่อหน่วย
        </p>
      </div>
    </div>
  );
}
