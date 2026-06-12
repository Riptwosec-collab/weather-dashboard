import '@testing-library/jest-dom';

// Mock maplibre-gl (it requires a canvas which jsdom doesn't support)
vi.mock('maplibre-gl', () => ({
  default: {},
  Map: vi.fn(),
}));

vi.mock('react-map-gl/maplibre', () => ({
  default: vi.fn(() => null),
  Source: vi.fn(() => null),
  Layer: vi.fn(() => null),
  Marker: vi.fn(() => null),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch globally (individual tests can override)
global.fetch = vi.fn();
