import { useEffect, useCallback } from 'react';
import { useWeatherStore } from '../store/weatherStore';

/**
 * Global keyboard shortcuts for the weather dashboard.
 *
 * /  →  focus city search input
 * l  →  switch to Layers panel
 * t  →  switch to Timeline panel
 * a  →  switch to Analysis panel
 * u  →  toggle °C / °F
 * s  →  copy share link to clipboard
 * Escape → blur focused input
 */
export function useKeyboardShortcuts(onFocusSearch?: () => void) {
  const { toggleTempUnit, setMobilePanel } = useWeatherStore();

  const handler = useCallback((e: KeyboardEvent) => {
    // Ignore shortcuts when typing in an input / textarea
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      if (e.key === 'Escape') (e.target as HTMLElement).blur();
      return;
    }

    switch (e.key.toLowerCase()) {
      case '/':
        e.preventDefault();
        onFocusSearch?.();
        break;
      case 'l':
        setMobilePanel('layers');
        break;
      case 't':
        setMobilePanel('timeline');
        break;
      case 'a':
        setMobilePanel('analysis');
        break;
      case 'u':
        toggleTempUnit();
        break;
      case 's':
        navigator.clipboard.writeText(window.location.href).catch(() => null);
        break;
      default:
        break;
    }
  }, [onFocusSearch, toggleTempUnit, setMobilePanel]);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
