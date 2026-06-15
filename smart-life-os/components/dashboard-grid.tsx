"use client";

import { AiBriefingCard } from "@/components/ai-briefing-card";
import { FoodRadarWidget } from "@/components/widgets/food-radar-widget";
import { MarketWidget } from "@/components/widgets/market-widget";
import { TechUtilitiesWidget } from "@/components/widgets/tech-utilities-widget";
import { WeatherMapWidget } from "@/components/widgets/weather-map-widget";
import { WidgetShell } from "@/components/widget-shell";
import type { WidgetId } from "@/lib/types";
import { useDashboardStore } from "@/store/dashboard-store";

const widgetRenderers: Record<WidgetId, JSX.Element> = {
  weather: <WeatherMapWidget />,
  food: <FoodRadarWidget />,
  market: <MarketWidget />,
  tech: <TechUtilitiesWidget />
};

export function DashboardGrid() {
  const widgets = useDashboardStore((state) => state.widgets);
  const toggleWidget = useDashboardStore((state) => state.toggleWidget);
  const reorderWidget = useDashboardStore((state) => state.reorderWidget);

  const orderedWidgets = [...widgets].sort((a, b) => a.order - b.order);
  const activeWidgetIds = orderedWidgets.filter((widget) => widget.enabled).map((widget) => widget.id);

  return (
    <section className="grid gap-5">
      <AiBriefingCard activeWidgetIds={activeWidgetIds} />

      <div className="grid gap-5 xl:grid-cols-2">
        {orderedWidgets.map((widget) =>
          widget.enabled ? (
            <WidgetShell
              key={widget.id}
              id={widget.id}
              title={widget.title}
              description={widget.description}
              onMoveUp={() => reorderWidget(widget.id, "up")}
              onMoveDown={() => reorderWidget(widget.id, "down")}
              onToggle={() => toggleWidget(widget.id)}
            >
              {widgetRenderers[widget.id]}
            </WidgetShell>
          ) : null
        )}
      </div>

      <div className="glass-panel rounded-[1.5rem] p-4">
        <p className="text-sm font-semibold text-white">Widget toggle</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {orderedWidgets.map((widget) => (
            <button
              key={widget.id}
              type="button"
              onClick={() => toggleWidget(widget.id)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                widget.enabled ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-slate-700 text-slate-400"
              }`}
            >
              {widget.enabled ? "เปิด" : "ปิด"} {widget.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
