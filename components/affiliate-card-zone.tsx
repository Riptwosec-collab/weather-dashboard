import type { WidgetId } from "@/lib/types";
import { getAffiliateBuyLink } from "@/lib/affiliate";
import { ShoppingBag } from "lucide-react";

export function AffiliateCardZone({ widgetId: _widgetId }: { widgetId: WidgetId }) {
  const href = getAffiliateBuyLink();

  if (!href) return null;

  return (
    <div className="mt-5">
      <a
        className="sharp-button inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        <ShoppingBag size={16} />
        ซื้อสินค้า
      </a>
    </div>
  );
}
