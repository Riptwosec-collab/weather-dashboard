import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, EyeOff } from "lucide-react";
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
    <article className="widget-card rounded-lg p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button aria-label="Move up" className="ghost-button flex h-8 w-8 items-center justify-center transition" onClick={onMoveUp} title="Move up" type="button">
            <ArrowUp size={15} />
          </button>
          <button aria-label="Move down" className="ghost-button flex h-8 w-8 items-center justify-center transition" onClick={onMoveDown} title="Move down" type="button">
            <ArrowDown size={15} />
          </button>
          <button aria-label="Hide widget" className="ghost-button flex h-8 w-8 items-center justify-center transition" onClick={onToggle} title="Hide widget" type="button">
            <EyeOff size={15} />
          </button>
        </div>
      </div>
      {children}
      <AffiliateCardZone widgetId={id} />
    </article>
  );
}
