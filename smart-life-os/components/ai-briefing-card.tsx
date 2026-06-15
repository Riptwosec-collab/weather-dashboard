"use client";

import { useEffect, useMemo, useState } from "react";
import type { WidgetId } from "@/lib/types";

type AiBriefingCardProps = {
  activeWidgetIds: WidgetId[];
};

export function AiBriefingCard({ activeWidgetIds }: AiBriefingCardProps) {
  const [briefing, setBriefing] = useState<string[]>([
    "กำลังรวมข้อมูลจาก widget ที่เปิดใช้งาน...",
    "ระบบจะสรุปเป็นภาษาไทย 2 บรรทัดให้เหมาะกับวันนี้"
  ]);
  const [loading, setLoading] = useState(true);

  const body = useMemo(() => JSON.stringify({ activeWidgets: activeWidgetIds }), [activeWidgetIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadBriefing() {
      setLoading(true);
      try {
        const response = await fetch("/api/briefing", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body
        });
        const data = (await response.json()) as { lines?: string[] };
        if (!cancelled && data.lines?.length) {
          setBriefing(data.lines.slice(0, 2));
        }
      } catch {
        if (!cancelled) {
          setBriefing([
            "วันนี้เช็คฝน ร้านใกล้ตัว และตลาดก่อนออกจากบ้านได้ในหน้าเดียว",
            "เปิด widget ที่ใช้บ่อยไว้บนสุด เพื่อให้ dashboard กลายเป็นหน้าเริ่มวันของคุณ"
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBriefing();
    return () => {
      cancelled = true;
    };
  }, [body]);

  return (
    <section className="glass-panel rounded-[1.75rem] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">AI Daily Briefing</p>
          <h2 className="mt-1 text-xl font-bold text-white">สรุปเช้าวันนี้</h2>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
          {loading ? "syncing" : "ready"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {briefing.map((line) => (
          <p key={line} className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4 text-sm leading-6 text-slate-100">
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
