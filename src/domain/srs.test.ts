import { describe, expect, it } from 'vitest';
import {
  BOX_INTERVALS,
  MAX_BOX,
  boxDistribution,
  createCard,
  dueCards,
  masteredCount,
  reviewCard,
} from './srs';

const TODAY = '2026-03-02';

describe('어휘 복습 (Leitner)', () => {
  it('새 카드는 1번 상자에서 오늘 복습 대상이다', () => {
    const card = createCard('w01d1:solve', 'solve', '풀다', 'w01d1', TODAY);
    expect(card.box).toBe(1);
    expect(card.due).toBe(TODAY);
    expect(dueCards([card], TODAY)).toHaveLength(1);
  });

  it('맞히면 상자가 올라가고 복습 간격이 길어진다', () => {
    let card = createCard('id', 'solve', '풀다', 'w01d1', TODAY);
    card = reviewCard(card, true, TODAY);
    expect(card.box).toBe(2);
    expect(card.due).toBe('2026-03-04'); // +2일
    expect(card.correct).toBe(1);
  });

  it('틀리면 1번 상자로 돌아간다', () => {
    let card = createCard('id', 'solve', '풀다', 'w01d1', TODAY);
    card = reviewCard(card, true, TODAY);
    card = reviewCard(card, true, TODAY);
    expect(card.box).toBe(3);
    card = reviewCard(card, false, TODAY);
    expect(card.box).toBe(1);
    expect(card.due).toBe('2026-03-03'); // +1일
    expect(card.wrong).toBe(1);
  });

  it('상자는 최대치를 넘지 않는다', () => {
    let card = createCard('id', 'solve', '풀다', 'w01d1', TODAY);
    for (let i = 0; i < 10; i += 1) card = reviewCard(card, true, TODAY);
    expect(card.box).toBe(MAX_BOX);
    expect(BOX_INTERVALS).toHaveLength(MAX_BOX);
    expect(masteredCount([card])).toBe(1);
  });

  it('예정일이 지난 카드만 복습 대상이 된다', () => {
    const soon = { ...createCard('a', 'a', 'a', 's', TODAY), due: '2026-03-01' };
    const later = { ...createCard('b', 'b', 'b', 's', TODAY), due: '2026-03-10' };
    const due = dueCards([later, soon], TODAY);
    expect(due.map((c) => c.id)).toEqual(['a']);
  });

  it('상자별 분포를 센다', () => {
    const cards = [
      createCard('a', 'a', 'a', 's', TODAY),
      { ...createCard('b', 'b', 'b', 's', TODAY), box: 3 },
      { ...createCard('c', 'c', 'c', 's', TODAY), box: 3 },
    ];
    expect(boxDistribution(cards)).toEqual([1, 0, 2, 0, 0]);
  });
});
