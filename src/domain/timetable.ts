import type { AreaId, Weekday } from '@/content/schema';

/**
 * 주 5일 시간표 (분).
 * 원래 설계된 표를 그대로 옮긴 것이며, 콘텐츠 검증 테스트의 기준값이기도 하다.
 *   월 15/20/15/10/10, 화 15/15/15/10/15, 수 15/20/15/10/10,
 *   목 15/15/15/10/15, 금 15/15/15/10/15  → 하루 70분
 */
export const TIMETABLE: Record<Weekday, Record<AreaId, number>> = {
  mon: { vocab: 15, grammar: 20, reading: 15, listening: 10, speaking: 10 },
  tue: { vocab: 15, grammar: 15, reading: 15, listening: 10, speaking: 15 },
  wed: { vocab: 15, grammar: 20, reading: 15, listening: 10, speaking: 10 },
  thu: { vocab: 15, grammar: 15, reading: 15, listening: 10, speaking: 15 },
  fri: { vocab: 15, grammar: 15, reading: 15, listening: 10, speaking: 15 },
};

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
};

/** 하루 세션에서 진행하는 순서 */
export const AREA_ORDER: AreaId[] = ['vocab', 'grammar', 'reading', 'listening', 'speaking'];

export const AREA_LABEL: Record<AreaId, string> = {
  vocab: '어휘',
  grammar: '문법·구문',
  reading: '독해',
  listening: '듣기',
  speaking: '말하기',
};

export const AREA_DESCRIPTION: Record<AreaId, string> = {
  vocab: '오늘의 단어 10개를 보고, 뜻과 쓰임을 확인해요.',
  grammar: '문법 포인트 하나를 이해하고 문제로 확인해요.',
  reading: '지문을 읽고 무엇을 말하는 글인지 생각해요.',
  listening: '눈을 감고 들은 다음, 들린 대로 적어봐요.',
  speaking: '읽은 것을 영어로 짧게 말해봐요. 틀려도 괜찮아요.',
};

/** 하루 총 학습 시간(분) */
export function dayTotalMinutes(day: Weekday): number {
  return AREA_ORDER.reduce((sum, area) => sum + TIMETABLE[day][area], 0);
}

/** 말하기 15분인 요일에만 ④ 1분 말하기가 열린다 (화·목·금 = 주 3회) */
export function hasOneMinuteTalk(day: Weekday): boolean {
  return TIMETABLE[day].speaking >= 15;
}

/** JS Date의 getDay()(일=0)를 학습 요일로 변환한다. 주말이면 null. */
export function weekdayFromDate(date: Date): Weekday | null {
  const map: Record<number, Weekday | null> = {
    0: null,
    1: 'mon',
    2: 'tue',
    3: 'wed',
    4: 'thu',
    5: 'fri',
    6: null,
  };
  return map[date.getDay()] ?? null;
}
