import { NextResponse } from "next/server";
import { cacheTtl, cachedJson } from "@/lib/cache";
import { fallbackWeather } from "@/lib/mock-data";
import type { WeatherSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

type ForecastResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    rain?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
  };
};

type AirQualityResponse = {
  hourly?: {
    pm2_5?: number[];
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat") ?? "13.7563");
  const longitude = Number(searchParams.get("lon") ?? "100.5018");
  const location = searchParams.get("location") ?? "กรุงเทพฯ";
  const cacheKey = `weather:${latitude}:${longitude}`;

  const payload = await cachedJson<WeatherSnapshot>(cacheKey, cacheTtl.weather, async () => {
    try {
      const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
      forecastUrl.searchParams.set("latitude", String(latitude));
      forecastUrl.searchParams.set("longitude", String(longitude));
      forecastUrl.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,rain");
      forecastUrl.searchParams.set("hourly", "temperature_2m,precipitation_probability");
      forecastUrl.searchParams.set("forecast_days", "1");
      forecastUrl.searchParams.set("timezone", "Asia/Bangkok");

      const aqUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
      aqUrl.searchParams.set("latitude", String(latitude));
      aqUrl.searchParams.set("longitude", String(longitude));
      aqUrl.searchParams.set("hourly", "pm2_5");
      aqUrl.searchParams.set("forecast_days", "1");
      aqUrl.searchParams.set("timezone", "Asia/Bangkok");

      const [forecastResponse, aqResponse] = await Promise.all([fetch(forecastUrl), fetch(aqUrl)]);
      const forecast = (await forecastResponse.json()) as ForecastResponse;
      const airQuality = (await aqResponse.json()) as AirQualityResponse;

      const hourly = (forecast.hourly?.time ?? []).slice(0, 8).map((time, index) => ({
        time,
        temperature: Math.round(forecast.hourly?.temperature_2m?.[index] ?? 0),
        rainProbability: Math.round(forecast.hourly?.precipitation_probability?.[index] ?? 0),
        pm25: Math.round(airQuality.hourly?.pm2_5?.[index] ?? 0)
      }));

      const pm25 = hourly[0]?.pm25 ?? 0;
      const rain = forecast.current?.rain ?? 0;

      return {
        location,
        latitude,
        longitude,
        updatedAt: new Date().toISOString(),
        current: {
          temperature: Math.round(forecast.current?.temperature_2m ?? 0),
          humidity: Math.round(forecast.current?.relative_humidity_2m ?? 0),
          windSpeed: Math.round(forecast.current?.wind_speed_10m ?? 0),
          windDirection: Math.round(forecast.current?.wind_direction_10m ?? 0),
          rain,
          pm25
        },
        hourly,
        alerts: [
          rain > 0 ? "มีฝนในพื้นที่ ควรเผื่อเวลาเดินทาง" : "ยังไม่พบฝน ณ ตอนนี้",
          pm25 > 35 ? "PM2.5 สูง ควรลดกิจกรรมกลางแจ้ง" : "PM2.5 ยังอยู่ในระดับใช้งานทั่วไป"
        ]
      };
    } catch {
      return fallbackWeather();
    }
  });

  return NextResponse.json(payload);
}
