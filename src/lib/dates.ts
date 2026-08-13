const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

function parse(value: string): { year: number; month: number } {
  const match = YEAR_MONTH.exec(value);
  if (!match) {
    throw new Error(`Expected a date in YYYY-MM form (e.g. "2025-09"), received ${JSON.stringify(value)}`);
  }
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function formatMonthYear(value: string): string {
  const { year, month } = parse(value);
  return `${MONTHS[month - 1]} ${year}`;
}

export function formatRange(start: string, end: string | null): string {
  const tail = end === null ? 'Present' : formatMonthYear(end);
  return `${formatMonthYear(start)} — ${tail}`;
}

export function yearMarker(start: string): string {
  return String(parse(start).year);
}

export function isCurrent(end: string | null): boolean {
  return end === null;
}

export function compareByStartDesc(a: { start: string }, b: { start: string }): number {
  const left = parse(a.start);
  const right = parse(b.start);
  return right.year - left.year || right.month - left.month;
}
