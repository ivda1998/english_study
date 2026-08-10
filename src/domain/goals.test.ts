import { describe, expect, it } from 'vitest';
import type { SpeakingEntry } from '@/store/types';
import { computeMilestones, nextTargetSeconds } from './goals';

function talk(seconds: number, kind: SpeakingEntry['kind'] = 'oneMinute'): SpeakingEntry {
  return {
    id: `${kind}-${Math.random()}`,
    date: '2026-03-02',
    dayId: 'w01d2',
    kind,
    topic: 'My favorite subject',
    seconds,
    feeling: 'ok',
  };
}

describe('목표 진척도', () => {
  it('기록이 없으면 모두 0%이고 안내 문구가 나온다', () => {
    const milestones = computeMilestones([]);
    expect(milestones).toHaveLength(3);
    expect(milestones[0].percent).toBe(0);
    expect(milestones[0].status).toBe('아직 시작 전이에요');
    expect(milestones.every((m) => !m.done)).toBe(true);
  });

  it('1분 말하기를 10번 하고 평균 45초를 넘기면 1단계 도달', () => {
    const entries = Array.from({ length: 10 }, () => talk(50));
    const [g1] = computeMilestones(entries);
    expect(g1.percent).toBe(100);
    expect(g1.done).toBe(true);
  });

  it('횟수만 채우고 시간이 짧으면 아직 도달하지 않는다', () => {
    const entries = Array.from({ length: 12 }, () => talk(20));
    const [g1] = computeMilestones(entries);
    expect(g1.percent).toBeLessThan(100);
    expect(g1.done).toBe(false);
  });

  it('지문 설명(retell) 기록은 2단계에 반영된다', () => {
    const entries = Array.from({ length: 5 }, () => talk(100, 'retell'));
    const [, g2] = computeMilestones(entries);
    expect(g2.done).toBe(true);
  });
});

describe('1분 말하기 목표 시간', () => {
  it('처음에는 30초에서 시작한다', () => {
    expect(nextTargetSeconds([])).toBe(30);
  });

  it('30초를 해내면 1분으로 올라간다', () => {
    expect(nextTargetSeconds([talk(35), talk(32), talk(40)])).toBe(60);
  });

  it('1분을 해내면 1분 30초로 올라간다', () => {
    expect(nextTargetSeconds([talk(60), talk(58), talk(65)])).toBe(90);
  });

  it('직전 3회만 본다 — 예전에 잘했어도 최근이 짧으면 낮춰준다', () => {
    expect(nextTargetSeconds([talk(90), talk(90), talk(20), talk(20), talk(20)])).toBe(30);
  });
});
