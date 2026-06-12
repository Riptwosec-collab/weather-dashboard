import { useEffect, useMemo } from 'react';
import { useWeatherStore } from '../store/weatherStore';

export function useWeather() {
  const {
    selectedLocation, fetchWeather, fetchAirQuality, fetchHistorical,
    weatherData, isLoading, error,
    alertThresholds, dismissedAlerts, dismissAlert,
  } = useWeatherStore();

  const [lat, lng] = selectedLocation;

  // Debounced weather + AQI + historical fetch
  useEffect(() => {
    const t = setTimeout(() => {
      fetchWeather(lat, lng);
      fetchAirQuality(lat, lng);
      fetchHistorical(lat, lng);
    }, 800);
    return () => clearTimeout(t);
  }, [lat, lng, fetchWeather, fetchAirQuality, fetchHistorical]);

  // Alert detection
  const alerts = useMemo(() => {
    if (!weatherData) return [];
    const h = weatherData.hourly;
    const active: Array<{ key: string; message: string; level: 'warn' | 'danger' }> = [];

    const maxRain = Math.max(...h.precipitation.slice(0, 12));
    if (maxRain >= alertThresholds.rain) {
      const key = `rain_${Math.round(maxRain)}`;
      if (!dismissedAlerts.includes(key)) {
        active.push({
          key,
          message: `Heavy rain expected — up to ${maxRain.toFixed(1)} mm/h in the next 12 hours`,
          level: maxRain >= alertThresholds.rain * 2 ? 'danger' : 'warn',
        });
      }
    }

    const maxWind = Math.max(...(h.windspeed_10m?.slice(0, 12) ?? [0]));
    if (maxWind >= alertThresholds.wind) {
      const key = `wind_${Math.round(maxWind)}`;
      if (!dismissedAlerts.includes(key)) {
        active.push({
          key,
          message: `Strong wind — up to ${maxWind.toFixed(0)} km/h`,
          level: maxWind >= alertThresholds.wind * 1.5 ? 'danger' : 'warn',
        });
      }
    }

    const maxUV = Math.max(...(h.uv_index?.slice(0, 12) ?? [0]));
    if (maxUV >= alertThresholds.uv) {
      const key = `uv_${Math.round(maxUV)}`;
      if (!dismissedAlerts.includes(key)) {
        active.push({
          key,
          message: `High UV index — ${maxUV.toFixed(0)} (${maxUV >= 11 ? 'Extreme' : maxUV >= 8 ? 'Very High' : 'High'})`,
          level: maxUV >= 11 ? 'danger' : 'warn',
        });
      }
    }

    return active;
  }, [weatherData, alertThresholds, dismissedAlerts]);

  return { weatherData, isLoading, error, alerts, dismissAlert };
}
