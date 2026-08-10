import type { Day, Week } from '@/content/schema';
import type { DayProgress } from '@/store/types';
import { AREA_ORDER } from './timetable';

/** 기본 커리큘럼 위에 사용자가 넣은 주차를 덮어쓴다 (같은 주차 번호면 사용자 것이 이긴다). */
export function mergeWeeks(builtin: Week[], custom: Week[]): Week[] {
  const map = new Map<number, Week>();
  for (const w of builtin) map.set(w.week, w);
  for (const w of custom) map.set(w.week, w);
  return [...map.values()].sort((a, b) => a.week - b.week);
}

export function allDays(weeks: Week[]): Day[] {
  return weeks.flatMap((w) => w.days);
}

export function findDay(weeks: Week[], dayId: string): Day | undefined {
  return allDays(weeks).find((d) => d.id === dayId);
}

export function findWeekOf(weeks: Week[], dayId: string): Week | undefined {
  return weeks.find((w) => w.days.some((d) => d.id === dayId));
}

export function isDayComplete(progress: DayProgress | undefined): boolean {
  if (!progress) return false;
  return AREA_ORDER.every((area) => progress.blocks[area]?.status === 'done');
}

/** 그날 5개 블록 중 끝낸 개수 */
export function completedBlockCount(progress: DayProgress | undefined): number {
  if (!progress) return 0;
  return AREA_ORDER.filter((area) => progress.blocks[area]?.status === 'done').length;
}

/**
 * 오늘 할 학습일을 고른다.
 * 날짜로 강제하지 않고 "아직 끝내지 않은 가장 앞선 날"을 준다.
 * 하루 빠져도 밀리지 않으니 부담이 적다.
 */
export function nextDay(weeks: Week[], progressByDay: Record<string, DayProgress>): Day | undefined {
  const days = allDays(weeks);
  return days.find((d) => !isDayComplete(progressByDay[d.id])) ?? days[days.length - 1];
}

/** 전체 진도율 (0~100) */
export function overallPercent(
  weeks: Week[],
  progressByDay: Record<string, DayProgress>,
): number {
  const days = allDays(weeks);
  if (days.length === 0) return 0;
  const totalBlocks = days.length * AREA_ORDER.length;
  const done = days.reduce((sum, d) => sum + completedBlockCount(progressByDay[d.id]), 0);
  return Math.round((done / totalBlocks) * 100);
}

/** 완주한 날 수 */
export function completedDayCount(
  weeks: Week[],
  progressByDay: Record<string, DayProgress>,
): number {
  return allDays(weeks).filter((d) => isDayComplete(progressByDay[d.id])).length;
}

/** 지문을 문장 단위로 나눈다 (TTS·따라 읽기·받아쓰기에서 쓴다). */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 지문 문단 나누기 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
