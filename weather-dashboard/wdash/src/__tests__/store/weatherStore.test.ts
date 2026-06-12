import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWeatherStore } from '../../store/weatherStore';

const mockWeatherData = {
  latitude: 13.76, longitude: 100.5, timezone: 'Asia/Bangkok',
  hourly: {
    time: Array.from({ length: 48 }, (_, i) => `2025-01-15T${String(i % 24).padStart(2,'0')}:00`),
    temperature_2m:         Array(48).fill(30),
    precipitation:          Array(48).fill(0),
    precipitation_probability: Array(48).fill(20),
    surface_pressure:       Array(48).fill(1013),
    windspeed_10m:          Array(48).fill(15),
    winddirection_10m:      Array(48).fill(90),
    relative_humidity_2m:   Array(48).fill(70),
    uv_index:               Array(48).fill(5),
    weathercode:            Array(48).fill(1),
    cloudcover:             Array(48).fill(20),
  },
  daily: {
    time: Array.from({ length: 7 }, (_, i) => `2025-01-${15+i}`),
    temperature_2m_max:            Array(7).fill(34),
    temperature_2m_min:            Array(7).fill(26),
    precipitation_sum:             Array(7).fill(2),
    precipitation_probability_max: Array(7).fill(30),
    weathercode:  Array(7).fill(1),
    sunrise:      Array(7).fill('2025-01-15T06:30'),
    sunset:       Array(7).fill('2025-01-15T18:00'),
    uv_index_max: Array(7).fill(9),
    windspeed_10m_max: Array(7).fill(20),
  },
};

beforeEach(() => {
  useWeatherStore.setState({
    activeLayers: ['radar'],
    selectedLocation: [13.7563, 100.5018],
    locationName: 'Bangkok',
    tempUnit: 'C',
    theme: 'dark',
    weatherData: null,
    airQualityData: null,
    historicalData: null,
    isLoading: false,
    error: null,
    currentTime: 0,
    savedLocations: [],
    compareLocations: [],
    alertThresholds: { rain: 10, wind: 50, uv: 8, aqi: 100 },
    dismissedAlerts: [],
    showOnboarding: true,
    pushEnabled: false,
  });
  vi.clearAllMocks();
  localStorage.clear();
});

describe('toggleLayer', () => {
  it('adds inactive layer', () => {
    useWeatherStore.getState().toggleLayer('wind');
    expect(useWeatherStore.getState().activeLayers).toContain('wind');
  });
  it('removes active layer', () => {
    useWeatherStore.getState().toggleLayer('radar');
    expect(useWeatherStore.getState().activeLayers).not.toContain('radar');
  });
});

describe('toggleTheme', () => {
  it('switches dark → light', () => {
    useWeatherStore.getState().toggleTheme();
    expect(useWeatherStore.getState().theme).toBe('light');
  });
  it('switches light → dark', () => {
    useWeatherStore.getState().toggleTheme();
    useWeatherStore.getState().toggleTheme();
    expect(useWeatherStore.getState().theme).toBe('dark');
  });
});

describe('compareLocations', () => {
  const loc = { id: 'tokyo', name: 'Tokyo', lat: 35.67, lng: 139.65, weatherData: null };
  it('adds compare location', () => {
    useWeatherStore.getState().addCompareLocation(loc);
    expect(useWeatherStore.getState().compareLocations).toHaveLength(1);
  });
  it('does not duplicate', () => {
    useWeatherStore.getState().addCompareLocation(loc);
    useWeatherStore.getState().addCompareLocation(loc);
    expect(useWeatherStore.getState().compareLocations).toHaveLength(1);
  });
  it('removes compare location', () => {
    useWeatherStore.getState().addCompareLocation(loc);
    useWeatherStore.getState().removeCompareLocation('tokyo');
    expect(useWeatherStore.getState().compareLocations).toHaveLength(0);
  });
  it('caps at 2 compare locations', () => {
    for (let i = 0; i < 4; i++) {
      useWeatherStore.getState().addCompareLocation({ ...loc, id: `loc_${i}` });
    }
    expect(useWeatherStore.getState().compareLocations.length).toBeLessThanOrEqual(2);
  });
});

describe('dismissOnboarding', () => {
  it('sets showOnboarding false', () => {
    useWeatherStore.getState().dismissOnboarding();
    expect(useWeatherStore.getState().showOnboarding).toBe(false);
  });
});

describe('fetchWeather', () => {
  it('sets weatherData including precipitation_probability on success', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true, json: async () => mockWeatherData,
    } as Response);
    await useWeatherStore.getState().fetchWeather(13.7563, 100.5018);
    const data = useWeatherStore.getState().weatherData;
    expect(data).not.toBeNull();
    expect(data?.hourly.precipitation_probability).toBeDefined();
    expect(data?.daily.precipitation_probability_max).toBeDefined();
  });

  it('sets error on network fail', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));
    await useWeatherStore.getState().fetchWeather(13.7563, 100.5018);
    expect(useWeatherStore.getState().error).toMatch(/Network error/);
  });
});

describe('alertThresholds with aqi', () => {
  it('updates aqi threshold', () => {
    useWeatherStore.getState().setAlertThreshold({ aqi: 150 });
    expect(useWeatherStore.getState().alertThresholds.aqi).toBe(150);
  });
});
