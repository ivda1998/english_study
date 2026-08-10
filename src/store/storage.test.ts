import { describe, expect, it } from 'vitest';
import {
  CURRENT_VERSION,
  STORAGE_KEY,
  createEmptyData,
  getData,
  reconcile,
  reloadFromStorage,
} from './storage';
import { completeBlock, registerVocab, startBlock } from './actions';
import type { Day } from '@/content/schema';

describe('저장소', () => {
  it('빈 데이터는 현재 버전을 갖는다', () => {
    expect(createEmptyData('2026-03-02').version).toBe(CURRENT_VERSION);
  });

  it('깨진 값이 들어와도 기본값으로 복구한다', () => {
    expect(reconcile('그냥 문자열', '2026-03-02')).toEqual(createEmptyData('2026-03-02'));
    expect(reconcile(null, '2026-03-02').days).toEqual({});
  });

  it('일부 필드만 있어도 나머지는 기본값으로 채운다', () => {
    const result = reconcile({ version: 1, profile: { name: '지호' } }, '2026-03-02');
    expect(result.profile.name).toBe('지호');
    expect(result.profile.startDate).toBe('2026-03-02');
    expect(result.settings.rate).toBe(0.85);
    expect(result.speaking).toEqual([]);
  });

  it('TTS 속도는 허용 범위로 잘라낸다', () => {
    expect(reconcile({ version: 1, settings: { rate: 99 } }).settings.rate).toBe(1.2);
    expect(reconcile({ version: 1, settings: { rate: 0.1 } }).settings.rate).toBe(0.5);
  });

  it('localStorage에 저장되고 다시 읽힌다', () => {
    startBlock('w01d1', 'vocab', '2026-03-02');
    completeBlock('w01d1', 'vocab', { seconds: 300, score: { correct: 8, total: 10 } });
    expect(localStorage.getItem(STORAGE_KEY)).toContain('w01d1');
    reloadFromStorage();
    expect(getData().days.w01d1.blocks.vocab?.status).toBe('done');
    expect(getData().days.w01d1.blocks.vocab?.score).toEqual({ correct: 8, total: 10 });
  });

  it('다섯 블록을 모두 끝내야 하루가 완료된다', () => {
    const areas = ['vocab', 'grammar', 'reading', 'listening', 'speaking'] as const;
    areas.slice(0, 4).forEach((a) => completeBlock('w01d2', a, { seconds: 60 }));
    expect(getData().days.w01d2.completedAt).toBeUndefined();
    completeBlock('w01d2', 'speaking', { seconds: 60 });
    expect(getData().days.w01d2.completedAt).toBeTruthy();
  });

  it('같은 단어를 다시 등록해도 복습 진행 상황을 덮어쓰지 않는다', () => {
    const day = {
      id: 'w01d1',
      vocab: [{ word: 'solve', pos: 'v.', meaning: '풀다', example: 'I solve it.', exampleKo: '나는 푼다.' }],
    } as Day;
    registerVocab(day, '2026-03-02');
    const first = getData().srs['w01d1:solve'];
    registerVocab(day, '2026-03-05');
    expect(getData().srs['w01d1:solve']).toBe(first);
  });
});
