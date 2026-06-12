import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeocoding } from '../../hooks/useGeocoding';

const mockResults = {
  results: [
    { id: 1, name: 'Bangkok', latitude: 13.75, longitude: 100.5, country: 'Thailand', country_code: 'TH' },
    { id: 2, name: 'Bangalore', latitude: 12.97, longitude: 77.59, country: 'India', country_code: 'IN' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useGeocoding', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useGeocoding());
    expect(result.current.query).toBe('');
    expect(result.current.results).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets isLoading after typing', () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as Response);

    const { result } = renderHook(() => useGeocoding());
    act(() => { result.current.setQuery('Ban'); });
    expect(result.current.isLoading).toBe(true);
  });

  it('fetches results after debounce', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as Response);

    const { result } = renderHook(() => useGeocoding());
    act(() => { result.current.setQuery('Bangkok'); });
    act(() => { vi.advanceTimersByTime(450); }); // past 400ms debounce

    await waitFor(() => {
      expect(result.current.results).toHaveLength(2);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('clears results when query is emptied', () => {
    const { result } = renderHook(() => useGeocoding());
    act(() => { result.current.setQuery('Bangkok'); });
    act(() => { result.current.setQuery(''); });
    expect(result.current.results).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('clears on clear()', () => {
    const { result } = renderHook(() => useGeocoding());
    act(() => { result.current.setQuery('Bangkok'); });
    act(() => { result.current.clear(); });
    expect(result.current.query).toBe('');
    expect(result.current.results).toHaveLength(0);
  });

  it('handles API error gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network fail'));
    const { result } = renderHook(() => useGeocoding());
    act(() => { result.current.setQuery('xxx'); });
    act(() => { vi.advanceTimersByTime(450); });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.results).toHaveLength(0);
    });
  });
});
