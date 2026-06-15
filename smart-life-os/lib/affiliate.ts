import type { AffiliateCard, WidgetId } from "@/lib/types";

const affiliateCatalog: Record<WidgetId, AffiliateCard[]> = {
  weather: [
    {
      id: "weather-raincoat",
      widgetId: "weather",
      title: "เสื้อกันฝนพกพา",
      description: "เหมาะกับขับรถ/ออกทริปช่วงฝนตก ไม่กินพื้นที่กระเป๋า",
      label: "Road trip",
      cta: "ดูไอเทมกันฝน",
      href: "https://shopee.co.th/search?keyword=%E0%B9%80%E0%B8%AA%E0%B8%B7%E0%B9%89%E0%B8%AD%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B8%9D%E0%B8%99%20%E0%B8%9E%E0%B8%81%E0%B8%9E%E0%B8%B2"
    },
    {
      id: "weather-powerbank",
      widgetId: "weather",
      title: "Power bank สำหรับเดินทาง",
      description: "สำรองแบตมือถือเวลาต้องใช้แผนที่/เรดาร์ฝนระหว่างทริป",
      label: "Travel gear",
      cta: "ดู power bank",
      href: "https://shopee.co.th/search?keyword=power%20bank%20travel"
    }
  ],
  food: [
    {
      id: "food-card-promo",
      widgetId: "food",
      title: "บัตรเครดิตสายกิน",
      description: "ใช้เทียบโปรร้านบุฟเฟต์/ชาบู/ยากินิกุ ก่อนออกไปกินจริง",
      label: "Food promo",
      cta: "ดูโปรร้านอาหาร",
      href: "https://www.lazada.co.th/tag/restaurant-promotion/"
    }
  ],
  market: [
    {
      id: "market-notebook-stand",
      widgetId: "market",
      title: "แท่นวางโน้ตบุ๊กสำหรับดูกราฟ",
      description: "จัดโต๊ะให้ดูกราฟ หุ้น ทอง และคริปโตได้ถนัดขึ้น",
      label: "Desk setup",
      cta: "ดูของจัดโต๊ะ",
      href: "https://shopee.co.th/search?keyword=notebook%20stand%20desk%20setup"
    }
  ],
  tech: [
    {
      id: "tech-cable-label",
      widgetId: "tech",
      title: "ป้าย Label สาย LAN",
      description: "เหมาะกับทำงาน Helpdesk/Network ให้ไล่สายง่ายขึ้น",
      label: "IT gear",
      cta: "ดูอุปกรณ์ IT",
      href: "https://shopee.co.th/search?keyword=lan%20cable%20label"
    }
  ]
};

export function getAffiliateCards(widgetId: WidgetId): AffiliateCard[] {
  return affiliateCatalog[widgetId] ?? [];
}

export function getAllAffiliateCards(): AffiliateCard[] {
  return Object.values(affiliateCatalog).flat();
}
