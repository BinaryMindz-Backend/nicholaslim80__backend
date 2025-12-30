export function isHoliday(date: Date): boolean {
  const holidays = [
    '2025-01-01',
    '2025-02-21',
    '2025-12-16',
  ];
  return holidays.includes(date.toISOString().slice(0, 10));
}
