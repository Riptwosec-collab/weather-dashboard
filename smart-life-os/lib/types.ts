export type Language = "th" | "en";

export type LifestyleRole = "traveler" | "investor" | "tech-worker" | "foodie" | "balanced";

export type WidgetId = "weather" | "food" | "market" | "tech";

export type WidgetConfig = {
  id: WidgetId;
  title: string;
  description: string;
  enabled: boolean;
  order: number;
};

export type OnboardingAnswer = {
  role: LifestyleRole;
  province: string;
  goals: string[];
  budgetFocus: "saving" | "balanced" | "premium";
};

export type WeatherSnapshot = {
  location: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    rain: number;
    pm25: number;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    rainProbability: number;
    pm25: number;
  }>;
  alerts: string[];
};

export type FoodPlace = {
  id: string;
  name: string;
  type: "Yakiniku" | "Shabu" | "Sukiyaki" | "Isaan" | "Buffet";
  distanceKm: number;
  openNow: boolean;
  hours: string;
  cardPromotions: string[];
  rating: number;
};

export type MarketAsset = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  currency: string;
};

export type BuyLot = {
  id: string;
  units: number;
  price: number;
};

export type TechToolResult = {
  title: string;
  value: string;
  hint?: string;
};

export type AffiliateCard = {
  id: string;
  widgetId: WidgetId;
  title: string;
  description: string;
  label: string;
  cta: string;
  href: string;
};

export type BriefingPayload = {
  weather?: WeatherSnapshot;
  markets?: MarketAsset[];
  food?: FoodPlace[];
  activeWidgets: WidgetId[];
};
