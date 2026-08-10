import { toISODate } from '@/domain/date';
import type { AppData } from './types';

export const STORAGE_KEY = 'english-study.v1';
export const CURRENT_VERSION = 1;

export function createEmptyData(today = toISODate()): AppData {
  return {
    version: CURRENT_VERSION,
    profile: { name: '', startDate: today },
    days: {},
    srs: {},
    wrongNotes: [],
    speaking: [],
    stageLogs: {},
    customVocab: [],
    customWeeks: [],
    weekend: [],
    settings: { rate: 0.85, voiceURI: null, theme: 'system' },
  };
}

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * 버전 n → n+1 마이그레이션.
 * 저장 구조를 바꿀 때 여기에 함수를 추가하면 기존 사용자의 기록이 보존된다.
 */
const MIGRATIONS: Record<number, Migration> = {
  // 예시: 1: (d) => ({ ...d, version: 2, newField: [] }),
};

/** 저장된 값이 부분적으로 비어 있어도 앱이 죽지 않도록 기본값과 합친다. */
export function reconcile(raw: unknown, today = toISODate()): AppData {
  const base = createEmptyData(today);
  if (typeof raw !== 'object' || raw === null) return base;

  let data = raw as Record<string, unknown>;
  let version = typeof data.version === 'number' ? data.version : 0;
  while (version < CURRENT_VERSION && MIGRATIONS[version]) {
    data = MIGRATIONS[version](data);
    version = typeof data.version === 'number' ? data.version : version + 1;
  }

  const profile = (data.profile ?? {}) as Record<string, unknown>;
  const settings = (data.settings ?? {}) as Record<string, unknown>;
  const rate = typeof settings.rate === 'number' ? settings.rate : base.settings.rate;

  return {
    version: CURRENT_VERSION,
    profile: {
      name: typeof profile.name === 'string' ? profile.name : base.profile.name,
      startDate:
        typeof profile.startDate === 'string' ? profile.startDate : base.profile.startDate,
    },
    days: isRecord(data.days) ? (data.days as AppData['days']) : base.days,
    srs: isRecord(data.srs) ? (data.srs as AppData['srs']) : base.srs,
    wrongNotes: Array.isArray(data.wrongNotes)
      ? (data.wrongNotes as AppData['wrongNotes'])
      : base.wrongNotes,
    speaking: Array.isArray(data.speaking) ? (data.speaking as AppData['speaking']) : base.speaking,
    stageLogs: isRecord(data.stageLogs) ? (data.stageLogs as AppData['stageLogs']) : base.stageLogs,
    customVocab: Array.isArray(data.customVocab)
      ? (data.customVocab as AppData['customVocab'])
      : base.customVocab,
    customWeeks: Array.isArray(data.customWeeks)
      ? (data.customWeeks as AppData['customWeeks'])
      : base.customWeeks,
    weekend: Array.isArray(data.weekend) ? (data.weekend as AppData['weekend']) : base.weekend,
    settings: {
      rate: Math.min(1.2, Math.max(0.5, rate)),
      voiceURI: typeof settings.voiceURI === 'string' ? settings.voiceURI : null,
      theme:
        settings.theme === 'light' || settings.theme === 'dark' || settings.theme === 'system'
          ? settings.theme
          : 'system',
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStorage(): AppData {
  if (typeof localStorage === 'undefined') return createEmptyData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyData();
    return reconcile(JSON.parse(raw));
  } catch {
    // 저장 값이 깨졌더라도 앱은 계속 동작해야 한다.
    return createEmptyData();
  }
}

let state: AppData = readStorage();
const listeners = new Set<() => void>();

function persist() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장 공간이 꽉 찬 경우에도 화면은 계속 동작하게 둔다.
  }
}

export function getData(): AppData {
  return state;
}

/** 업데이터는 반드시 새 객체를 돌려줘야 한다 (React가 변경을 감지하도록). */
export function updateData(updater: (data: AppData) => AppData): void {
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

export function replaceData(next: AppData): void {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 테스트/초기화용 */
export function resetData(today = toISODate()): void {
  replaceData(createEmptyData(today));
}

/** 저장소를 다시 읽어온다 (가져오기 직후 등) */
export function reloadFromStorage(): void {
  state = readStorage();
  listeners.forEach((l) => l());
}
