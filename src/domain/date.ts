/** 로컬 시간 기준 YYYY-MM-DD */
export function toISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const date = fromISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = fromISODate(fromIso).getTime();
  const b = fromISODate(toIso).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** 최근 n일 날짜 배열 (오래된 날짜 → 오늘) */
export function lastNDays(n: number, today = toISODate()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

export function formatKoreanDate(iso: string): string {
  const d = fromISODate(iso);
  const names = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${names[d.getDay()]})`;
}

/** 초를 "1분 20초" 형태로 */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m === 0) return `${rest}초`;
  if (rest === 0) return `${m}분`;
  return `${m}분 ${rest}초`;
}

/** 초를 mm:ss 형태로 */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
