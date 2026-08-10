import { describe, expect, it } from 'vitest';
import {
  AREA_ORDER,
  TIMETABLE,
  WEEKDAYS,
  dayTotalMinutes,
  hasOneMinuteTalk,
  weekdayFromDate,
} from './timetable';

describe('시간표', () => {
  it('설계된 표와 정확히 일치한다', () => {
    expect(TIMETABLE).toEqual({
      mon: { vocab: 15, grammar: 20, reading: 15, listening: 10, speaking: 10 },
      tue: { vocab: 15, grammar: 15, reading: 15, listening: 10, speaking: 15 },
      wed: { vocab: 15, grammar: 20, reading: 15, listening: 10, speaking: 10 },
      thu: { vocab: 15, grammar: 15, reading: 15, listening: 10, speaking: 15 },
      fri: { vocab: 15, grammar: 15, reading: 15, listening: 10, speaking: 15 },
    });
  });

  it('하루 총 학습 시간은 60~70분이다', () => {
    for (const day of WEEKDAYS) {
      const total = dayTotalMinutes(day);
      expect(total).toBeGreaterThanOrEqual(60);
      expect(total).toBeLessThanOrEqual(70);
    }
  });

  it('1분 말하기는 화·목·금에만 열린다 (주 3회)', () => {
    expect(WEEKDAYS.filter(hasOneMinuteTalk)).toEqual(['tue', 'thu', 'fri']);
  });

  it('블록 순서는 어휘 → 문법 → 독해 → 듣기 → 말하기', () => {
    expect(AREA_ORDER).toEqual(['vocab', 'grammar', 'reading', 'listening', 'speaking']);
  });

  it('주말은 학습 요일이 아니다', () => {
    // 2026-03-07 = 토, 2026-03-08 = 일, 2026-03-09 = 월
    expect(weekdayFromDate(new Date(2026, 2, 7))).toBeNull();
    expect(weekdayFromDate(new Date(2026, 2, 8))).toBeNull();
    expect(weekdayFromDate(new Date(2026, 2, 9))).toBe('mon');
  });
});
