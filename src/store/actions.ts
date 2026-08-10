import { useSyncExternalStore } from 'react';
import type { AreaId, Day, Question, Week } from '@/content/schema';
import { toISODate } from '@/domain/date';
import { createCard, reviewCard, type SrsCard } from '@/domain/srs';
import { getData, subscribe, updateData } from './storage';
import type {
  AppData,
  CustomVocabSet,
  SpeakingEntry,
  WeekendLog,
  WrongNote,
} from './types';

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getData, getData);
}

/* ------------------------------------------------------------- 프로필/설정 */

export function setProfile(patch: Partial<AppData['profile']>) {
  updateData((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
}

export function setSettings(patch: Partial<AppData['settings']>) {
  updateData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
}

/* ----------------------------------------------------------------- 진도 */

function ensureDay(d: AppData, dayId: string, today: string): AppData {
  if (d.days[dayId]) return d;
  return {
    ...d,
    days: { ...d.days, [dayId]: { dayId, startedOn: today, blocks: {} } },
  };
}

export function startBlock(dayId: string, area: AreaId, today = toISODate()) {
  updateData((prev) => {
    const d = ensureDay(prev, dayId, today);
    const day = d.days[dayId];
    if (day.blocks[area]) return d;
    return {
      ...d,
      days: {
        ...d.days,
        [dayId]: {
          ...day,
          blocks: { ...day.blocks, [area]: { status: 'in_progress', seconds: 0 } },
        },
      },
    };
  });
}

export function completeBlock(
  dayId: string,
  area: AreaId,
  payload: { seconds: number; score?: { correct: number; total: number } },
  today = toISODate(),
) {
  updateData((prev) => {
    const d = ensureDay(prev, dayId, today);
    const day = d.days[dayId];
    const previous = day.blocks[area];
    const blocks = {
      ...day.blocks,
      [area]: {
        status: 'done' as const,
        seconds: (previous?.seconds ?? 0) + Math.max(0, Math.round(payload.seconds)),
        score: payload.score ?? previous?.score,
        completedAt: new Date().toISOString(),
      },
    };
    const allDone = (['vocab', 'grammar', 'reading', 'listening', 'speaking'] as AreaId[]).every(
      (a) => blocks[a]?.status === 'done',
    );
    return {
      ...d,
      days: {
        ...d.days,
        [dayId]: {
          ...day,
          blocks,
          completedAt: allDone ? (day.completedAt ?? new Date().toISOString()) : day.completedAt,
        },
      },
    };
  });
}

/** 시간만 누적 (블록을 떠날 때 호출) */
export function addBlockSeconds(dayId: string, area: AreaId, seconds: number, today = toISODate()) {
  if (seconds <= 0) return;
  updateData((prev) => {
    const d = ensureDay(prev, dayId, today);
    const day = d.days[dayId];
    const previous = day.blocks[area] ?? { status: 'in_progress' as const, seconds: 0 };
    return {
      ...d,
      days: {
        ...d.days,
        [dayId]: {
          ...day,
          blocks: {
            ...day.blocks,
            [area]: { ...previous, seconds: previous.seconds + Math.round(seconds) },
          },
        },
      },
    };
  });
}

/* --------------------------------------------------------------- 오답 노트 */

export function recordWrongAnswers(
  dayId: string,
  area: AreaId,
  entries: { question: Question; myAnswer: string }[],
  today = toISODate(),
) {
  if (entries.length === 0) return;
  updateData((prev) => {
    const map = new Map(prev.wrongNotes.map((n) => [n.id, n]));
    for (const { question, myAnswer } of entries) {
      const id = `${dayId}:${question.id}`;
      const correctAnswer =
        question.kind === 'choice'
          ? question.options[question.answer]
          : question.kind === 'write'
            ? question.accept[0]
            : '';
      const note: WrongNote = {
        id,
        dayId,
        area,
        questionId: question.id,
        prompt: question.prompt,
        correctAnswer,
        myAnswer,
        explanation: question.kind === 'free' ? '' : question.explanation,
        createdAt: today,
        resolved: false,
      };
      map.set(id, note);
    }
    return { ...prev, wrongNotes: [...map.values()] };
  });
}

export function resolveWrongNote(id: string) {
  updateData((prev) => ({
    ...prev,
    wrongNotes: prev.wrongNotes.map((n) => (n.id === id ? { ...n, resolved: true } : n)),
  }));
}

export function clearResolvedNotes() {
  updateData((prev) => ({ ...prev, wrongNotes: prev.wrongNotes.filter((n) => !n.resolved) }));
}

/* ------------------------------------------------------------------ 어휘 */

/** 그날 배운 단어를 복습 카드로 등록한다 (이미 있으면 그대로 둔다). */
export function registerVocab(day: Day, today = toISODate()) {
  updateData((prev) => {
    const srs = { ...prev.srs };
    for (const item of day.vocab) {
      const id = `${day.id}:${item.word.toLowerCase()}`;
      if (!srs[id]) srs[id] = createCard(id, item.word, item.meaning, day.id, today);
    }
    return { ...prev, srs };
  });
}

export function registerCustomVocab(set: CustomVocabSet, today = toISODate()) {
  updateData((prev) => {
    const srs = { ...prev.srs };
    for (const item of set.items) {
      const id = `custom:${set.id}:${item.word.toLowerCase()}`;
      if (!srs[id]) srs[id] = createCard(id, item.word, item.meaning, set.name, today);
    }
    return {
      ...prev,
      srs,
      customVocab: [...prev.customVocab.filter((s) => s.id !== set.id), set],
    };
  });
}

export function removeCustomVocab(setId: string) {
  updateData((prev) => {
    const srs = Object.fromEntries(
      Object.entries(prev.srs).filter(([id]) => !id.startsWith(`custom:${setId}:`)),
    );
    return { ...prev, srs, customVocab: prev.customVocab.filter((s) => s.id !== setId) };
  });
}

export function applyVocabReview(results: { card: SrsCard; correct: boolean }[], today = toISODate()) {
  if (results.length === 0) return;
  updateData((prev) => {
    const srs = { ...prev.srs };
    for (const { card, correct } of results) {
      const current = srs[card.id] ?? card;
      srs[card.id] = reviewCard(current, correct, today);
    }
    return { ...prev, srs };
  });
}

/* ---------------------------------------------------------------- 말하기 */

export function logSpeakingStages(
  dayId: string,
  patch: Partial<Omit<AppData['stageLogs'][string], 'dayId' | 'date'>>,
  today = toISODate(),
) {
  updateData((prev) => {
    const current = prev.stageLogs[dayId] ?? {
      dayId,
      date: today,
      shadowingDone: false,
      substitutionCount: 0,
      qnaCount: 0,
    };
    return {
      ...prev,
      stageLogs: { ...prev.stageLogs, [dayId]: { ...current, ...patch, dayId, date: today } },
    };
  });
}

export function addSpeakingEntry(entry: Omit<SpeakingEntry, 'id'>) {
  updateData((prev) => ({
    ...prev,
    speaking: [
      ...prev.speaking,
      { ...entry, id: `${entry.dayId}-${entry.kind}-${Date.now()}` },
    ],
  }));
}

export function removeSpeakingEntry(id: string) {
  updateData((prev) => ({ ...prev, speaking: prev.speaking.filter((e) => e.id !== id) }));
}

/* ------------------------------------------------------------------ 주말 */

export function addWeekendLog(log: WeekendLog) {
  updateData((prev) => ({
    ...prev,
    weekend: [...prev.weekend.filter((w) => w.date !== log.date), log],
  }));
}

/* --------------------------------------------------------- 커스텀 콘텐츠 */

export function upsertCustomWeek(week: Week) {
  updateData((prev) => ({
    ...prev,
    customWeeks: [...prev.customWeeks.filter((w) => w.week !== week.week), week].sort(
      (a, b) => a.week - b.week,
    ),
  }));
}

export function removeCustomWeek(weekNo: number) {
  updateData((prev) => ({
    ...prev,
    customWeeks: prev.customWeeks.filter((w) => w.week !== weekNo),
  }));
}
