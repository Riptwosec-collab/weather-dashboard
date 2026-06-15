import type { ReactNode } from "react";
import type { WidgetId } from "@/lib/types";
import { AffiliateCardZone } from "@/components/affiliate-card-zone";

type WidgetShellProps = {
  id: WidgetId;
  title: string;
  description: string;
  children: ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggle?: () => void;
};

export function WidgetShell({ id, title, description, children, onMoveUp, onMoveDown, onToggle }: WidgetShellProps) {
  return (
    <article className="widget-card rounded-[1.75rem] p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300" onClick={onMoveUp} type="button">↑</button>
          <button className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300" onClick={onMoveDown} type="button">↓</button>
          <button className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300" onClick={onToggle} type="button">ซ่อน</button>
        </div>
      </div>
      {children}
      <AffiliateCardZone widgetId={id} />
    </article>
  );
}
