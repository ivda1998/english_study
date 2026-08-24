/* ---------------------------------------------------------------------------
   콘텐츠 스키마
   - 커리큘럼 JSON(week-NN.json)이 지켜야 할 타입과, 외부 라이브러리 없이 동작하는
     검증기를 함께 둔다. 검증기는 테스트와 빌드 전에 실행되어 잘못된 콘텐츠가
     배포되는 것을 막는다.
--------------------------------------------------------------------------- */

import { hasMarkup, isMarkupBalanced, stripMarkup } from '@/domain/markup';

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
export type AreaId = 'vocab' | 'grammar' | 'reading' | 'listening' | 'speaking';

export type PartOfSpeech =
  | 'n.'
  | 'v.'
  | 'adj.'
  | 'adv.'
  | 'prep.'
  | 'conj.'
  | 'pron.'
  | 'phr.';

export interface VocabItem {
  /** 표제어 */
  word: string;
  pos: PartOfSpeech;
  /** 한국어 뜻 */
  meaning: string;
  /** 영어 예문 */
  example: string;
  /** 예문 해석 */
  exampleKo: string;
}

/** 4지선다 — 학교 시험에서 가장 흔한 형태 */
export interface ChoiceQuestion {
  kind: 'choice';
  id: string;
  prompt: string;
  options: string[];
  /** options 배열의 0-based 인덱스 */
  answer: number;
  /** 한국어 해설 (필수) */
  explanation: string;
}

/** 단답 서술 — 정답 후보를 여러 개 허용하고 대소문자·문장부호는 무시한다 */
export interface WriteQuestion {
  kind: 'write';
  id: string;
  prompt: string;
  /** 허용 정답들 */
  accept: string[];
  explanation: string;
  hint?: string;
}

/** 채점하지 않는 자기 서술 — 모범 답안만 보여준다 */
export interface FreeQuestion {
  kind: 'free';
  id: string;
  prompt: string;
  sample: string;
  explanation?: string;
}

export type Question = ChoiceQuestion | WriteQuestion | FreeQuestion;

export interface GrammarBlock {
  /** 문법 포인트 이름 (예: 관계대명사 who) */
  point: string;
  /** 한국어 설명 */
  explanation: string;
  examples: { en: string; ko: string }[];
  exercises: Question[];
}

export interface Passage {
  title: string;
  /** 소재 태그 (예: 학교생활) */
  topic: string;
  /** 본문. 문단은 빈 줄로 구분한다. */
  body: string;
  glossary: { word: string; meaning: string }[];
  /** 전체 해석 — 다 푼 뒤에만 보여준다 */
  translation: string;
}

export interface ReadingBlock {
  passage: Passage;
  questions: Question[];
}

export interface ScriptLine {
  /** 대화면 화자 이름, 독백이면 생략 */
  speaker?: string;
  text: string;
}

export interface ListeningBlock {
  /** 무엇을 들을지 안내하는 한국어 한 줄 */
  intro: string;
  script: ScriptLine[];
  questions: Question[];
  /** 받아쓰기용 문장. 없으면 독해 지문에서 자동으로 만든다. */
  dictation?: string[];
}

export interface SpeakingBlock {
  /** ① 따라 읽기 — 그날 지문에서 고른 2~3문장 */
  shadowing: string[];
  /** ② 문장 바꿔 말하기 */
  substitution: {
    /** 치환 자리를 {키} 로 표시한 패턴 문장 */
    pattern: string;
    slots: { key: string; options: string[] }[];
    /** 화면에 보여줄 완성 예시 */
    examples: string[];
  };
  /** ③ 질문에 답하기 — 5개 */
  qna: { question: string; sample: string }[];
  /** ④ 1분 말하기 — 말하기 15분인 요일(화·목·금)에만 존재 */
  oneMinute?: {
    topic: string;
    topicKo: string;
    /** 키워드 5개만 보고 말한다 */
    keywords: string[];
  };
  /** 수학 연결 말하기 — 주 1회 */
  mathTalk?: {
    problem: string;
    problemKo: string;
    /** 기본형 First / Then / Finally */
    basic: string[];
    /** 익숙해졌을 때의 확장형 */
    upgraded: string[];
  };
}

export interface Day {
  /** 'w01d1' 형식 */
  id: string;
  week: number;
  dayOfWeek: Weekday;
  /** 그날의 한국어 제목 */
  title: string;
  vocab: VocabItem[];
  grammar: GrammarBlock;
  reading: ReadingBlock;
  listening: ListeningBlock;
  speaking: SpeakingBlock;
}

export interface Week {
  week: number;
  title: string;
  /** 그 주의 초점 한 줄 */
  focus: string;
  /** 그 주 말하기 주제 5개 (고정 30개 중 해당 주차) */
  speakingTopics: string[];
  days: Day[];
}

/* --------------------------------------------------------------- 검증기 */

export interface ValidationIssue {
  path: string;
  message: string;
}

class Validator {
  issues: ValidationIssue[] = [];

  fail(path: string, message: string) {
    this.issues.push({ path, message });
  }

  str(value: unknown, path: string, opts: { min?: number } = {}): value is string {
    if (typeof value !== 'string') {
      this.fail(path, `문자열이어야 합니다 (받은 값: ${typeof value})`);
      return false;
    }
    if (value.trim().length < (opts.min ?? 1)) {
      this.fail(path, `내용이 비어 있거나 너무 짧습니다 (최소 ${opts.min ?? 1}자)`);
      return false;
    }
    return true;
  }

  arr(value: unknown, path: string, opts: { min?: number; max?: number } = {}): value is unknown[] {
    if (!Array.isArray(value)) {
      this.fail(path, '배열이어야 합니다');
      return false;
    }
    if (opts.min !== undefined && value.length < opts.min) {
      this.fail(path, `${opts.min}개 이상이어야 합니다 (현재 ${value.length}개)`);
      return false;
    }
    if (opts.max !== undefined && value.length > opts.max) {
      this.fail(path, `${opts.max}개 이하여야 합니다 (현재 ${value.length}개)`);
      return false;
    }
    return true;
  }
}

const POS_VALUES: PartOfSpeech[] = ['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'phr.'];
const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

/** 주차별 지문 길이 목표(단어 수). 난이도가 점진적으로 오르는지 검사한다. */
/**
 * 주차별 지문 길이. 수능·모의고사 수준으로 올리는 중이며, 아직 옮기지 않은 주차는
 * 예전 기준을 그대로 둔다. 한 주차를 새로 쓸 때 그 줄만 새 값으로 바꾼다.
 */
export const PASSAGE_LENGTH_TARGET: Record<number, { min: number; max: number }> = {
  1: { min: 175, max: 210 },
  2: { min: 105, max: 140 },
  3: { min: 115, max: 150 },
  4: { min: 125, max: 160 },
  5: { min: 135, max: 172 },
  6: { min: 150, max: 195 },
};

/**
 * 주차별 하루 어휘 개수. 지문과 같은 이유로 주차마다 다를 수 있다.
 * 어휘 문항은 개수와 무관하게 QUIZ_SIZE개로 묶이고, 나머지는 복습에서 만난다.
 */
export const VOCAB_PER_DAY: Record<number, number> = {
  1: 30,
  2: 10,
  3: 10,
  4: 10,
  5: 10,
  6: 10,
};

/** 표에 없는 주차(사용자가 직접 넣은 콘텐츠)에 적용할 기본값 */
export const VOCAB_PER_DAY_DEFAULT = { min: 10, max: 30 };

export function countWords(text: string): number {
  // 밑줄 표기는 분량이 아니므로 세지 않는다.
  return stripMarkup(text).trim().split(/\s+/).filter(Boolean).length;
}

/**
 * "밑줄 친 …" 이라고 말하는 문항에는 실제로 `[[...]]` 밑줄 표기가 있어야 한다.
 * 지시문만 있고 표기가 없으면 화면에서 어디를 가리키는지 알 수 없어 문제를 풀 수 없다.
 */
function validateUnderline(v: Validator, o: Record<string, unknown>, path: string) {
  const prompt = typeof o.prompt === 'string' ? o.prompt : '';
  const options = Array.isArray(o.options) ? (o.options as unknown[]).filter(isString) : [];
  const texts = [prompt, ...options];

  texts.forEach((text, i) => {
    if (!isMarkupBalanced(text)) {
      const where = i === 0 ? `${path}.prompt` : `${path}.options[${i - 1}]`;
      v.fail(where, '밑줄 표기 [[ ]] 의 짝이 맞지 않습니다');
    }
  });

  if (!prompt.includes('밑줄')) return;
  if (!texts.some(hasMarkup)) {
    v.fail(
      `${path}.prompt`,
      '"밑줄"이라고 했는데 밑줄 표기가 없습니다 — 가리킬 부분을 [[ ]] 로 감싸세요',
    );
  }
}

function isString(x: unknown): x is string {
  return typeof x === 'string';
}

/** 줄바꿈과 연속 공백을 하나로 눌러 문장 대조를 쉽게 만든다. */
function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function validateQuestion(v: Validator, q: unknown, path: string, seenIds: Set<string>) {
  if (typeof q !== 'object' || q === null) {
    v.fail(path, '객체여야 합니다');
    return;
  }
  const o = q as Record<string, unknown>;
  if (v.str(o.id, `${path}.id`)) {
    if (seenIds.has(o.id)) v.fail(`${path}.id`, `문항 id가 중복됩니다: ${o.id}`);
    seenIds.add(o.id);
  }
  v.str(o.prompt, `${path}.prompt`, { min: 2 });

  switch (o.kind) {
    case 'choice': {
      if (v.arr(o.options, `${path}.options`, { min: 2, max: 5 })) {
        (o.options as unknown[]).forEach((opt, i) => v.str(opt, `${path}.options[${i}]`));
        const len = (o.options as unknown[]).length;
        if (typeof o.answer !== 'number' || !Number.isInteger(o.answer)) {
          v.fail(`${path}.answer`, '정답은 정수 인덱스여야 합니다');
        } else if (o.answer < 0 || o.answer >= len) {
          v.fail(`${path}.answer`, `정답 인덱스 ${o.answer}가 보기 범위(0~${len - 1})를 벗어납니다`);
        }
        const uniq = new Set((o.options as string[]).map((s) => String(s).trim()));
        if (uniq.size !== len) v.fail(`${path}.options`, '보기 중에 같은 것이 있습니다');
      }
      v.str(o.explanation, `${path}.explanation`, { min: 5 });
      break;
    }
    case 'write': {
      if (v.arr(o.accept, `${path}.accept`, { min: 1 })) {
        (o.accept as unknown[]).forEach((a, i) => v.str(a, `${path}.accept[${i}]`));
      }
      v.str(o.explanation, `${path}.explanation`, { min: 5 });
      break;
    }
    case 'free': {
      v.str(o.sample, `${path}.sample`, { min: 5 });
      break;
    }
    default:
      v.fail(`${path}.kind`, `알 수 없는 문항 종류: ${String(o.kind)}`);
  }

  validateUnderline(v, o, path);
}

function validateDay(
  v: Validator,
  day: unknown,
  path: string,
  weekNo: number,
  index: number,
  seenIds: Set<string>,
) {
  if (typeof day !== 'object' || day === null) {
    v.fail(path, '객체여야 합니다');
    return;
  }
  const d = day as Record<string, unknown>;
  const expectedId = `w${String(weekNo).padStart(2, '0')}d${index + 1}`;
  if (d.id !== expectedId) v.fail(`${path}.id`, `id는 '${expectedId}' 여야 합니다 (현재 '${String(d.id)}')`);
  if (d.week !== weekNo) v.fail(`${path}.week`, `week는 ${weekNo} 여야 합니다`);
  if (d.dayOfWeek !== WEEKDAYS[index]) {
    v.fail(`${path}.dayOfWeek`, `${index + 1}번째 날은 '${WEEKDAYS[index]}' 여야 합니다`);
  }
  v.str(d.title, `${path}.title`);

  // 어휘 — 주차별로 정해진 개수만큼
  const vocabCount = VOCAB_PER_DAY[weekNo];
  const vocabRange = vocabCount
    ? { min: vocabCount, max: vocabCount }
    : VOCAB_PER_DAY_DEFAULT;
  if (v.arr(d.vocab, `${path}.vocab`, vocabRange)) {
    const words = new Set<string>();
    (d.vocab as unknown[]).forEach((item, i) => {
      const p = `${path}.vocab[${i}]`;
      if (typeof item !== 'object' || item === null) {
        v.fail(p, '객체여야 합니다');
        return;
      }
      const w = item as Record<string, unknown>;
      if (v.str(w.word, `${p}.word`)) {
        const key = String(w.word).toLowerCase();
        if (words.has(key)) v.fail(`${p}.word`, `같은 날 안에서 단어가 중복됩니다: ${String(w.word)}`);
        words.add(key);
      }
      if (!POS_VALUES.includes(w.pos as PartOfSpeech)) {
        v.fail(`${p}.pos`, `품사는 ${POS_VALUES.join(', ')} 중 하나여야 합니다`);
      }
      v.str(w.meaning, `${p}.meaning`);
      if (v.str(w.example, `${p}.example`, { min: 8 })) {
        const ex = String(w.example).toLowerCase();
        const base = String(w.word ?? '').toLowerCase().split(' ')[0];
        // 굴절형을 감안해 앞 4글자만 비교한다.
        const stem = base.slice(0, Math.max(4, Math.min(base.length, 5)));
        if (stem && !ex.includes(stem)) {
          v.fail(`${p}.example`, `예문에 표제어(${String(w.word)})가 보이지 않습니다`);
        }
      }
      v.str(w.exampleKo, `${p}.exampleKo`);
    });
  }

  // 문법
  const g = d.grammar as Record<string, unknown> | undefined;
  if (!g || typeof g !== 'object') {
    v.fail(`${path}.grammar`, '객체여야 합니다');
  } else {
    v.str(g.point, `${path}.grammar.point`);
    v.str(g.explanation, `${path}.grammar.explanation`, { min: 20 });
    if (v.arr(g.examples, `${path}.grammar.examples`, { min: 2 })) {
      (g.examples as unknown[]).forEach((e, i) => {
        const p = `${path}.grammar.examples[${i}]`;
        const ex = e as Record<string, unknown>;
        v.str(ex?.en, `${p}.en`, { min: 5 });
        v.str(ex?.ko, `${p}.ko`);
      });
    }
    if (v.arr(g.exercises, `${path}.grammar.exercises`, { min: 5 })) {
      (g.exercises as unknown[]).forEach((q, i) =>
        validateQuestion(v, q, `${path}.grammar.exercises[${i}]`, seenIds),
      );
    }
  }

  // 독해
  const r = d.reading as Record<string, unknown> | undefined;
  if (!r || typeof r !== 'object') {
    v.fail(`${path}.reading`, '객체여야 합니다');
  } else {
    const ps = r.passage as Record<string, unknown> | undefined;
    if (!ps || typeof ps !== 'object') {
      v.fail(`${path}.reading.passage`, '객체여야 합니다');
    } else {
      v.str(ps.title, `${path}.reading.passage.title`);
      v.str(ps.topic, `${path}.reading.passage.topic`);
      v.str(ps.translation, `${path}.reading.passage.translation`, { min: 30 });
      if (v.str(ps.body, `${path}.reading.passage.body`, { min: 200 })) {
        const words = countWords(ps.body as string);
        const target = PASSAGE_LENGTH_TARGET[weekNo];
        if (target && (words < target.min || words > target.max)) {
          v.fail(
            `${path}.reading.passage.body`,
            `${weekNo}주차 지문은 ${target.min}~${target.max}단어여야 합니다 (현재 ${words}단어)`,
          );
        }
      }
      if (v.arr(ps.glossary, `${path}.reading.passage.glossary`, { min: 2 })) {
        (ps.glossary as unknown[]).forEach((gl, i) => {
          const p = `${path}.reading.passage.glossary[${i}]`;
          const o = gl as Record<string, unknown>;
          v.str(o?.word, `${p}.word`);
          v.str(o?.meaning, `${p}.meaning`);
        });
      }
    }
    if (v.arr(r.questions, `${path}.reading.questions`, { min: 3 })) {
      (r.questions as unknown[]).forEach((q, i) =>
        validateQuestion(v, q, `${path}.reading.questions[${i}]`, seenIds),
      );
    }
  }

  // 듣기
  const l = d.listening as Record<string, unknown> | undefined;
  if (!l || typeof l !== 'object') {
    v.fail(`${path}.listening`, '객체여야 합니다');
  } else {
    v.str(l.intro, `${path}.listening.intro`);
    if (v.arr(l.script, `${path}.listening.script`, { min: 2 })) {
      (l.script as unknown[]).forEach((line, i) => {
        const p = `${path}.listening.script[${i}]`;
        const o = line as Record<string, unknown>;
        v.str(o?.text, `${p}.text`, { min: 3 });
        if (o?.speaker !== undefined) v.str(o.speaker, `${p}.speaker`);
      });
    }
    if (v.arr(l.questions, `${path}.listening.questions`, { min: 2 })) {
      (l.questions as unknown[]).forEach((q, i) =>
        validateQuestion(v, q, `${path}.listening.questions[${i}]`, seenIds),
      );
    }
    if (l.dictation !== undefined && v.arr(l.dictation, `${path}.listening.dictation`, { min: 1 })) {
      (l.dictation as unknown[]).forEach((s, i) =>
        v.str(s, `${path}.listening.dictation[${i}]`, { min: 10 }),
      );
    }
  }

  // 말하기
  const s = d.speaking as Record<string, unknown> | undefined;
  if (!s || typeof s !== 'object') {
    v.fail(`${path}.speaking`, '객체여야 합니다');
  } else {
    if (v.arr(s.shadowing, `${path}.speaking.shadowing`, { min: 2, max: 3 })) {
      // 따라 읽기 문장은 그날 지문에서 그대로 가져와야 한다. 방금 읽은 문장을
      // 소리 내어 보는 것이 목적이므로, 지문에 없는 문장이면 연결이 끊긴다.
      const passageBody = ((d.reading as Record<string, unknown> | undefined)?.passage as
        | Record<string, unknown>
        | undefined)?.body;
      const haystack =
        typeof passageBody === 'string' ? collapse(stripMarkup(passageBody)) : undefined;
      (s.shadowing as unknown[]).forEach((line, i) => {
        const p = `${path}.speaking.shadowing[${i}]`;
        if (!v.str(line, p, { min: 10 })) return;
        if (haystack && !haystack.includes(collapse(line as string))) {
          v.fail(p, '따라 읽기 문장이 그날 지문 본문에 없습니다');
        }
      });
    }
    const sub = s.substitution as Record<string, unknown> | undefined;
    if (!sub || typeof sub !== 'object') {
      v.fail(`${path}.speaking.substitution`, '객체여야 합니다');
    } else if (v.str(sub.pattern, `${path}.speaking.substitution.pattern`, { min: 8 })) {
      const keys = [...String(sub.pattern).matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      if (keys.length === 0) {
        v.fail(`${path}.speaking.substitution.pattern`, '치환 자리 {키}가 최소 1개 필요합니다');
      }
      if (v.arr(sub.slots, `${path}.speaking.substitution.slots`, { min: 1 })) {
        const slotKeys = (sub.slots as Record<string, unknown>[]).map((sl) => String(sl?.key));
        keys.forEach((k) => {
          if (!slotKeys.includes(k)) {
            v.fail(`${path}.speaking.substitution.slots`, `패턴의 {${k}}에 해당하는 slot이 없습니다`);
          }
        });
        (sub.slots as unknown[]).forEach((sl, i) => {
          const p = `${path}.speaking.substitution.slots[${i}]`;
          const o = sl as Record<string, unknown>;
          v.str(o?.key, `${p}.key`);
          if (v.arr(o?.options, `${p}.options`, { min: 3 })) {
            (o.options as unknown[]).forEach((opt, j) => v.str(opt, `${p}.options[${j}]`));
          }
        });
      }
      if (v.arr(sub.examples, `${path}.speaking.substitution.examples`, { min: 2 })) {
        (sub.examples as unknown[]).forEach((e, i) =>
          v.str(e, `${path}.speaking.substitution.examples[${i}]`, { min: 8 }),
        );
      }
    }
    if (v.arr(s.qna, `${path}.speaking.qna`, { min: 5, max: 5 })) {
      (s.qna as unknown[]).forEach((item, i) => {
        const p = `${path}.speaking.qna[${i}]`;
        const o = item as Record<string, unknown>;
        v.str(o?.question, `${p}.question`, { min: 5 });
        v.str(o?.sample, `${p}.sample`, { min: 3 });
      });
    }

    // 1분 말하기는 말하기 15분인 요일(화·목·금)에만 있어야 한다.
    const needsOneMinute = ['tue', 'thu', 'fri'].includes(String(d.dayOfWeek));
    const om = s.oneMinute as Record<string, unknown> | undefined;
    if (needsOneMinute && !om) {
      v.fail(`${path}.speaking.oneMinute`, '말하기 15분인 요일에는 1분 말하기가 있어야 합니다');
    }
    if (!needsOneMinute && om) {
      v.fail(`${path}.speaking.oneMinute`, '말하기 10분인 요일(월·수)에는 1분 말하기를 두지 않습니다');
    }
    if (om) {
      v.str(om.topic, `${path}.speaking.oneMinute.topic`);
      v.str(om.topicKo, `${path}.speaking.oneMinute.topicKo`);
      if (v.arr(om.keywords, `${path}.speaking.oneMinute.keywords`, { min: 5, max: 5 })) {
        (om.keywords as unknown[]).forEach((k, i) =>
          v.str(k, `${path}.speaking.oneMinute.keywords[${i}]`),
        );
      }
    }

    const mt = s.mathTalk as Record<string, unknown> | undefined;
    if (mt) {
      v.str(mt.problem, `${path}.speaking.mathTalk.problem`);
      v.str(mt.problemKo, `${path}.speaking.mathTalk.problemKo`);
      if (v.arr(mt.basic, `${path}.speaking.mathTalk.basic`, { min: 3, max: 3 })) {
        (mt.basic as unknown[]).forEach((b, i) => v.str(b, `${path}.speaking.mathTalk.basic[${i}]`));
      }
      if (v.arr(mt.upgraded, `${path}.speaking.mathTalk.upgraded`, { min: 3, max: 3 })) {
        (mt.upgraded as unknown[]).forEach((b, i) =>
          v.str(b, `${path}.speaking.mathTalk.upgraded[${i}]`),
        );
      }
    }
  }
}

/** 주차 하나를 검증한다. 문항 id 중복 검사는 주차 안에서만 수행한다. */
export function validateWeek(raw: unknown, label = 'week'): ValidationIssue[] {
  const v = new Validator();
  if (typeof raw !== 'object' || raw === null) {
    v.fail(label, '객체여야 합니다');
    return v.issues;
  }
  const w = raw as Record<string, unknown>;
  const weekNo = w.week;
  if (typeof weekNo !== 'number' || !Number.isInteger(weekNo) || weekNo < 1) {
    v.fail(`${label}.week`, '주차 번호는 1 이상의 정수여야 합니다');
    return v.issues;
  }
  v.str(w.title, `${label}.title`);
  v.str(w.focus, `${label}.focus`);
  if (v.arr(w.speakingTopics, `${label}.speakingTopics`, { min: 5, max: 5 })) {
    (w.speakingTopics as unknown[]).forEach((t, i) =>
      v.str(t, `${label}.speakingTopics[${i}]`),
    );
  }
  const seenIds = new Set<string>();
  if (v.arr(w.days, `${label}.days`, { min: 5, max: 5 })) {
    (w.days as unknown[]).forEach((d, i) =>
      validateDay(v, d, `${label}.days[${i}]`, weekNo, i, seenIds),
    );
  }
  return v.issues;
}
