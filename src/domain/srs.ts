import { addDays, toISODate } from './date';

/**
 * 어휘 복습은 Leitner 상자 방식으로 관리한다.
 * 맞히면 다음 상자로, 틀리면 1번 상자로 돌아간다.
 * 상자별 복습 간격(일): 1→1, 2→2, 3→4, 4→8, 5→16
 */
export const BOX_INTERVALS = [1, 2, 4, 8, 16] as const;
export const MAX_BOX = BOX_INTERVALS.length;

export interface SrsCard {
  /** `${dayId}:${word}` 또는 커스텀 단어장의 경우 `custom:${setId}:${word}` */
  id: string;
  word: string;
  meaning: string;
  /** 출처 표시용 (예: w01d1, 내 단어장 이름) */
  source: string;
  /** 1 ~ MAX_BOX */
  box: number;
  /** 다음 복습 예정일 (YYYY-MM-DD) */
  due: string;
  correct: number;
  wrong: number;
  lastSeen: string;
}

export function createCard(
  id: string,
  word: string,
  meaning: string,
  source: string,
  today = toISODate(),
): SrsCard {
  return {
    id,
    word,
    meaning,
    source,
    box: 1,
    due: today,
    correct: 0,
    wrong: 0,
    lastSeen: today,
  };
}

/** 복습 결과를 반영해 다음 일정을 계산한다 (원본을 바꾸지 않는다). */
export function reviewCard(card: SrsCard, correct: boolean, today = toISODate()): SrsCard {
  const box = correct ? Math.min(card.box + 1, MAX_BOX) : 1;
  return {
    ...card,
    box,
    due: addDays(today, BOX_INTERVALS[box - 1]),
    correct: card.correct + (correct ? 1 : 0),
    wrong: card.wrong + (correct ? 0 : 1),
    lastSeen: today,
  };
}

/** 오늘 복습할 카드 (예정일이 오늘이거나 지난 것). 급한 것부터 정렬. */
export function dueCards(cards: SrsCard[], today = toISODate()): SrsCard[] {
  return cards
    .filter((c) => c.due <= today)
    .sort((a, b) => (a.due === b.due ? a.box - b.box : a.due < b.due ? -1 : 1));
}

/** 상자별 카드 수 — 성장 기록 화면에서 쓴다. */
export function boxDistribution(cards: SrsCard[]): number[] {
  const dist = Array<number>(MAX_BOX).fill(0);
  for (const c of cards) {
    const idx = Math.min(Math.max(c.box, 1), MAX_BOX) - 1;
    dist[idx] += 1;
  }
  return dist;
}

/** 마지막 상자에 도달한 = 외웠다고 볼 수 있는 단어 수 */
export function masteredCount(cards: SrsCard[]): number {
  return cards.filter((c) => c.box >= MAX_BOX).length;
}
