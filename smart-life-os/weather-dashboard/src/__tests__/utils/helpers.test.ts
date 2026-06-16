import { describe, it, expect } from 'vitest';
import {
  celsiusToF, formatTemp, wmoLabel, windDir,
  formatTime, formatDay,
} from '../../utils/helpers';

describe('celsiusToF', () => {
  it('converts 0°C to 32°F', () => expect(celsiusToF(0)).toBe(32));
  it('converts 100°C to 212°F', () => expect(celsiusToF(100)).toBe(212));
  it('converts 37°C to 98.6°F', () => expect(celsiusToF(37)).toBe(98.6));
  it('converts negative values', () => expect(celsiusToF(-40)).toBe(-40));
});

describe('formatTemp', () => {
  it('returns -- for null', () => expect(formatTemp(null, 'C')).toBe('--'));
  it('returns -- for undefined', () => expect(formatTemp(undefined, 'C')).toBe('--'));
  it('formats Celsius', () => expect(formatTemp(25, 'C')).toBe('25°C'));
  it('formats Fahrenheit', () => expect(formatTemp(0, 'F')).toBe('32°F'));
  it('formats decimal Celsius', () => expect(formatTemp(36.5, 'C')).toBe('36.5°C'));
});

describe('wmoLabel', () => {
  it('returns known label', () => expect(wmoLabel(0)).toBe('Clear sky'));
  it('returns unknown label for unmapped code', () => expect(wmoLabel(99)).toBe('Thunderstorm + heavy hail'));
  it('returns fallback for unmapped code', () => expect(wmoLabel(100)).toBe('Code 100'));
  it('returns -- for undefined', () => expect(wmoLabel(undefined)).toBe('--'));
});

describe('windDir', () => {
  it('returns N for 0°', () => expect(windDir(0)).toBe('N'));
  it('returns E for 90°', () => expect(windDir(90)).toBe('E'));
  it('returns S for 180°', () => expect(windDir(180)).toBe('S'));
  it('returns W for 270°', () => expect(windDir(270)).toBe('W'));
  it('returns NE for 45°', () => expect(windDir(45)).toBe('NE'));
  it('returns -- for undefined', () => expect(windDir(undefined)).toBe('--'));
  it('wraps at 360°', () => expect(windDir(360)).toBe('N'));
});

describe('formatTime', () => {
  it('returns -- for undefined', () => expect(formatTime(undefined)).toBe('--'));
  it('returns -- for empty string', () => expect(formatTime('')).toBe('--'));
  it('parses a valid ISO string', () => {
    const result = formatTime('2025-01-15T06:30:00');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatDay', () => {
  it('returns -- for undefined', () => expect(formatDay(undefined)).toBe('--'));
  it('parses a valid date string', () => {
    const result = formatDay('2025-01-15');
    // Should contain some day-of-week abbreviation
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('--');
  });
});
