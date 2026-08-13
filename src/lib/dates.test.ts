import { describe, expect, it } from 'vitest';
import {
  compareByStartDesc,
  formatMonthYear,
  formatRange,
  isCurrent,
  yearMarker,
} from './dates';

describe('formatMonthYear', () => {
  it('formats a year-month as abbreviated month and year', () => {
    expect(formatMonthYear('2025-09')).toBe('Sep 2025');
    expect(formatMonthYear('2021-11')).toBe('Nov 2021');
    expect(formatMonthYear('2024-01')).toBe('Jan 2024');
    expect(formatMonthYear('2024-12')).toBe('Dec 2024');
  });

  it('rejects a malformed value', () => {
    expect(() => formatMonthYear('2025-9')).toThrow(/YYYY-MM/);
    expect(() => formatMonthYear('2025')).toThrow(/YYYY-MM/);
    expect(() => formatMonthYear('Sep 2025')).toThrow(/YYYY-MM/);
    expect(() => formatMonthYear('')).toThrow(/YYYY-MM/);
  });

  it('rejects an out-of-range month', () => {
    expect(() => formatMonthYear('2025-13')).toThrow(/YYYY-MM/);
    expect(() => formatMonthYear('2025-00')).toThrow(/YYYY-MM/);
  });
});

describe('formatRange', () => {
  it('joins start and end with an em dash', () => {
    expect(formatRange('2024-04', '2025-09')).toBe('Apr 2024 — Sep 2025');
  });

  it('renders a null end as Present', () => {
    expect(formatRange('2025-09', null)).toBe('Sep 2025 — Present');
  });
});

describe('yearMarker', () => {
  it('returns the start year', () => {
    expect(yearMarker('2025-09')).toBe('2025');
    expect(yearMarker('2021-11')).toBe('2021');
  });
});

describe('isCurrent', () => {
  it('is true only when end is null', () => {
    expect(isCurrent(null)).toBe(true);
    expect(isCurrent('2025-09')).toBe(false);
  });
});

describe('compareByStartDesc', () => {
  it('sorts most recent first', () => {
    const roles = [
      { start: '2021-11' },
      { start: '2025-09' },
      { start: '2024-04' },
    ];
    expect(roles.sort(compareByStartDesc).map((r) => r.start)).toEqual([
      '2025-09',
      '2024-04',
      '2021-11',
    ]);
  });

  it('orders months correctly inside the same year', () => {
    const roles = [{ start: '2024-02' }, { start: '2024-11' }];
    expect(roles.sort(compareByStartDesc).map((r) => r.start)).toEqual([
      '2024-11',
      '2024-02',
    ]);
  });
});
