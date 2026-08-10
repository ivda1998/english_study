import type { AreaId, Week } from '@/content/schema';
import type { SrsCard } from '@/domain/srs';

export interface Profile {
  name: string;
  /** 학습 시작일 (YYYY-MM-DD) */
  startDate: string;
}

export interface BlockProgress {
  status: 'in_progress' | 'done';
  /** 실제로 머문 시간(초) */
  seconds: number;
  score?: { correct: number; total: number };
  completedAt?: string;
}

export interface DayProgress {
  dayId: string;
  /** 처음 시작한 날짜 */
  startedOn: string;
  blocks: Partial<Record<AreaId, BlockProgress>>;
  completedAt?: string;
}

export interface WrongNote {
  /** `${dayId}:${questionId}` */
  id: string;
  dayId: string;
  area: AreaId;
  questionId: string;
  prompt: string;
  correctAnswer: string;
  myAnswer: string;
  explanation: string;
  createdAt: string;
  /** 복습에서 다시 맞히면 true */
  resolved: boolean;
}

/** ④ 1분 말하기 / 수학 연결 말하기 기록 */
export interface SpeakingEntry {
  id: string;
  date: string;
  dayId: string;
  kind: 'oneMinute' | 'mathTalk' | 'retell';
  topic: string;
  seconds: number;
  feeling: 'easy' | 'ok' | 'hard';
  recordingId?: string;
}

/** ①~③ 단계 수행 기록 — 점수가 아니라 "했다"는 사실만 남긴다 */
export interface SpeakingStageLog {
  dayId: string;
  date: string;
  shadowingDone: boolean;
  substitutionCount: number;
  qnaCount: number;
}

export interface CustomVocabSet {
  id: string;
  name: string;
  createdAt: string;
  items: { word: string; meaning: string }[];
}

export interface WeekendLog {
  date: string;
  kind: string;
  minutes: number;
  note: string;
}

export interface Settings {
  /** TTS 속도 (0.6 ~ 1.1) */
  rate: number;
  voiceURI: string | null;
  theme: 'system' | 'light' | 'dark';
}

export interface AppData {
  version: number;
  profile: Profile;
  days: Record<string, DayProgress>;
  srs: Record<string, SrsCard>;
  wrongNotes: WrongNote[];
  speaking: SpeakingEntry[];
  stageLogs: Record<string, SpeakingStageLog>;
  customVocab: CustomVocabSet[];
  /** 사용자가 직접 넣은 주차 콘텐츠 (학교 교재 등) */
  customWeeks: Week[];
  weekend: WeekendLog[];
  settings: Settings;
}
