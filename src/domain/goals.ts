import type { SpeakingEntry } from '@/store/types';

/**
 * 목표는 처음 설계에서 정한 세 단계 그대로다.
 *  1) 중3 2학기 — 영어로 30초~1분 말하기가 부담스럽지 않게
 *  2) 겨울방학 — 영어 지문을 읽고 1~2분 자기 말로 설명하기
 *  3) 고1 — 준비한 내용을 발표하고, 영어 질문에도 짧게 대답하기
 *
 * 점수가 아니라 "얼마나 자주, 얼마나 오래 말했는가"로만 측정한다.
 * 정확도는 일부러 넣지 않았다.
 */
export interface Milestone {
  id: 'g1' | 'g2' | 'g3';
  when: string;
  title: string;
  detail: string;
  /** 0~100 */
  percent: number;
  /** 진척 상황을 사람 말로 */
  status: string;
  done: boolean;
}

function avgSeconds(entries: SpeakingEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((s, e) => s + e.seconds, 0) / entries.length;
}

/** 최근 n회 */
function recent(entries: SpeakingEntry[], n: number): SpeakingEntry[] {
  return entries.slice(-n);
}

function ratio(value: number, target: number): number {
  if (target <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

export function computeMilestones(speaking: SpeakingEntry[]): Milestone[] {
  const talks = speaking.filter((e) => e.kind === 'oneMinute' || e.kind === 'mathTalk');
  const retells = speaking.filter((e) => e.kind === 'retell');

  // 1) 말하기 10회 이상 + 최근 5회 평균 45초 이상
  const recent5 = recent(talks, 5);
  const g1Count = ratio(talks.length, 10);
  const g1Avg = ratio(avgSeconds(recent5), 45);
  const g1 = Math.round(g1Count * 0.5 + g1Avg * 0.5);

  // 2) 지문 설명(retell) 5회 이상 + 최근 3회 평균 90초 이상
  const recent3 = recent(retells, 3);
  const g2Count = ratio(retells.length, 5);
  const g2Avg = ratio(avgSeconds(recent3), 90);
  const g2 = Math.round(g2Count * 0.5 + g2Avg * 0.5);

  // 3) 누적 말하기 40회 + 최근 5회 평균 90초 이상
  const allTalks = [...talks, ...retells];
  const g3Count = ratio(allTalks.length, 40);
  const g3Avg = ratio(avgSeconds(recent(allTalks, 5)), 90);
  const g3 = Math.round(g3Count * 0.5 + g3Avg * 0.5);

  return [
    {
      id: 'g1',
      when: '중3 2학기',
      title: '30초~1분 말하기가 부담스럽지 않게',
      detail: '1분 말하기를 10번 이상 해보고, 최근 5번 평균이 45초를 넘기면 도달',
      percent: g1,
      status:
        talks.length === 0
          ? '아직 시작 전이에요'
          : `${talks.length}번 말했고, 최근 평균 ${Math.round(avgSeconds(recent5))}초`,
      done: g1 >= 100,
    },
    {
      id: 'g2',
      when: '겨울방학',
      title: '지문을 읽고 1~2분 자기 말로 설명하기',
      detail: '지문 설명하기를 5번 이상 하고, 최근 3번 평균이 90초를 넘기면 도달',
      percent: g2,
      status:
        retells.length === 0
          ? '1단계를 지나면 열려요'
          : `${retells.length}번 설명했고, 최근 평균 ${Math.round(avgSeconds(recent3))}초`,
      done: g2 >= 100,
    },
    {
      id: 'g3',
      when: '고1',
      title: '준비한 내용을 발표하고 짧게 대답하기',
      detail: '말하기 기록 40회 이상, 최근 5회 평균 90초 이상',
      percent: g3,
      status: `누적 ${allTalks.length}회`,
      done: g3 >= 100,
    },
  ];
}

/**
 * 1분 말하기 목표 시간(초).
 * 30초 → 1분 → 1분 30초로 스스로 올라가되, 직전 기록보다 급하게 올리지 않는다.
 */
export function nextTargetSeconds(pastEntries: SpeakingEntry[]): number {
  const talks = pastEntries.filter((e) => e.kind === 'oneMinute' || e.kind === 'mathTalk');
  if (talks.length === 0) return 30;
  const last3 = talks.slice(-3);
  const avg = avgSeconds(last3);
  if (avg >= 55) return 90;
  if (avg >= 28) return 60;
  return 30;
}
