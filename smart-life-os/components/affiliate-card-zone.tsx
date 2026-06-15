import type { WidgetId } from "@/lib/types";
import { getAffiliateCards } from "@/lib/affiliate";

export function AffiliateCardZone({ widgetId }: { widgetId: WidgetId }) {
  const cards = getAffiliateCards(widgetId);

  if (!cards.length) return null;

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {cards.slice(0, 2).map((card) => (
        <a
          key={card.id}
          className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 transition hover:border-cyan-200 hover:bg-cyan-300/15"
          href={card.href}
          rel="noreferrer"
          target="_blank"
        >
          <span className="rounded-full bg-cyan-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950">
            {card.label}
          </span>
          <p className="mt-3 font-semibold text-white">{card.title}</p>
          <p className="mt-1 text-xs leading-5 text-cyan-50/80">{card.description}</p>
          <p className="mt-3 text-xs font-bold text-cyan-100">{card.cta} →</p>
        </a>
      ))}
    </div>
  );
}
