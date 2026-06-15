import type { FoodPlace, MarketAsset, WeatherSnapshot } from "@/lib/types";

export const defaultBangkokLocation = {
  label: "กรุงเทพฯ",
  latitude: 13.7563,
  longitude: 100.5018
};

export const mockFoodPlaces: FoodPlace[] = [
  {
    id: "food-1",
    name: "Yakiniku Night Rama 9",
    type: "Yakiniku",
    distanceKm: 1.8,
    openNow: true,
    hours: "11:00-22:00",
    cardPromotions: ["บัตรเครดิตร่วมรายการลด 10%", "สะสมแต้ม x2 วันธรรมดา"],
    rating: 4.5
  },
  {
    id: "food-2",
    name: "Shabu Cloud Ratchathewi",
    type: "Shabu",
    distanceKm: 2.4,
    openNow: true,
    hours: "10:30-21:30",
    cardPromotions: ["มา 4 จ่าย 3 บางช่วงเวลา"],
    rating: 4.4
  },
  {
    id: "food-3",
    name: "Isaan Lab ส้มตำแซ่บ",
    type: "Isaan",
    distanceKm: 1.2,
    openNow: false,
    hours: "16:00-23:00",
    cardPromotions: ["เดลิเวอรีโค้ดส่วนลด"],
    rating: 4.7
  },
  {
    id: "food-4",
    name: "Buffet Station Ari",
    type: "Buffet",
    distanceKm: 4.6,
    openNow: true,
    hours: "11:00-22:00",
    cardPromotions: ["จองออนไลน์ลดเพิ่ม"],
    rating: 4.2
  }
];

export const mockMarkets: MarketAsset[] = [
  { symbol: "BTCUSDT", name: "Bitcoin", price: 104800, changePercent: 1.42, currency: "USD" },
  { symbol: "ETHUSDT", name: "Ethereum", price: 3640, changePercent: -0.64, currency: "USD" },
  { symbol: "NVDA", name: "NVIDIA", price: 178.24, changePercent: 0.86, currency: "USD" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", price: 575.12, changePercent: 0.22, currency: "USD" },
  { symbol: "XAU-TH", name: "ทองคำไทย 96.5%", price: 42550, changePercent: 0.18, currency: "THB" }
];

export function fallbackWeather(): WeatherSnapshot {
  const now = new Date();
  return {
    location: "กรุงเทพฯ",
    latitude: defaultBangkokLocation.latitude,
    longitude: defaultBangkokLocation.longitude,
    updatedAt: now.toISOString(),
    current: {
      temperature: 31,
      humidity: 72,
      windSpeed: 9,
      windDirection: 210,
      rain: 0.6,
      pm25: 18
    },
    hourly: Array.from({ length: 8 }).map((_, index) => ({
      time: new Date(now.getTime() + index * 60 * 60 * 1000).toISOString(),
      temperature: 31 - Math.min(index, 4),
      rainProbability: Math.min(85, 20 + index * 8),
      pm25: 18 + index
    })),
    alerts: ["ช่วงเย็นมีโอกาสฝนเพิ่ม เหมาะกับพกร่มหรือเสื้อกันฝน"]
  };
}
