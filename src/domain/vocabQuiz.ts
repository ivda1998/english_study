import type { ChoiceQuestion, Question, VocabItem, WriteQuestion } from '@/content/schema';

/**
 * 어휘 문제는 콘텐츠에 따로 쓰지 않고 그날 단어에서 만들어낸다.
 * 문항을 손으로 쓰지 않아도 되고, 형태가 항상 일정하다.
 * 같은 입력에는 항상 같은 문제가 나오도록 결정적으로 섞는다.
 */

/**
 * 하루 퀴즈 문항 수.
 * 단어가 이보다 많아도 문항은 늘리지 않는다 — 어휘 시간은 15분으로 고정이고,
 * 그날 다 못 물어본 단어는 복습(SRS)에서 반복해서 만나게 된다.
 */
export const QUIZ_SIZE = 10;

/** 문자열에서 만든 32비트 해시 — 시드로 쓴다 */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 예문에서 표제어를 밑줄로 가린다 (굴절형도 최대한 잡는다). */
export function blankOut(example: string, word: string): string {
  const base = word.split(' ')[0];
  const stem = base.length > 4 ? base.slice(0, base.length - 1) : base;
  const pattern = new RegExp(`\\b${escapeRegExp(stem)}\\w*\\b`, 'i');
  if (!pattern.test(example)) return example;
  return example.replace(pattern, '_______');
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 하루치 어휘 퀴즈를 만든다. 최대 QUIZ_SIZE 문항이다.
 * - 앞 절반: 영어 단어 → 한국어 뜻 고르기
 * - 뒤 절반: 예문 빈칸에 알맞은 단어 고르기
 *
 * 단어가 QUIZ_SIZE보다 많으면 그중 일부만 묻는다. 어느 단어를 고를지는
 * 날짜에서 정해지므로, 같은 날은 늘 같은 문제가 나온다.
 */
export function buildVocabQuiz(dayId: string, items: VocabItem[]): Question[] {
  if (items.length === 0) return [];
  const seed = hash(dayId);
  const asked = items.length > QUIZ_SIZE ? shuffled(items, seed).slice(0, QUIZ_SIZE) : items;
  const half = Math.ceil(asked.length / 2);
  const questions: Question[] = [];

  asked.forEach((item, index) => {
    // 오답 보기는 그날 단어 전체에서 고른다 — 물어보지 않는 단어도 눈에 익는다.
    const others = items.filter((w) => w.word !== item.word);
    const distractors = shuffled(others, seed + index).slice(0, 3);

    if (index < half) {
      const options = shuffled(
        [item.meaning, ...distractors.map((d) => d.meaning)],
        seed + index * 7,
      );
      const q: ChoiceQuestion = {
        kind: 'choice',
        id: `${dayId}-vq-${index + 1}`,
        prompt: `${item.word} (${item.pos}) 의 뜻은?`,
        options,
        answer: options.indexOf(item.meaning),
        explanation: `${item.word}: ${item.meaning}\n예) ${item.example} — ${item.exampleKo}`,
      };
      questions.push(q);
    } else {
      const options = shuffled(
        [item.word, ...distractors.map((d) => d.word)],
        seed + index * 13,
      );
      const q: ChoiceQuestion = {
        kind: 'choice',
        id: `${dayId}-vq-${index + 1}`,
        prompt: `빈칸에 알맞은 말은?\n${blankOut(item.example, item.word)}`,
        options,
        answer: options.indexOf(item.word),
        explanation: `${item.example} — ${item.exampleKo}`,
      };
      questions.push(q);
    }
  });

  return questions;
}

/** 복습용 단답 문제 (뜻 → 영어 단어 쓰기) */
export function buildRecallQuestion(
  id: string,
  word: string,
  meaning: string,
): WriteQuestion {
  return {
    kind: 'write',
    id,
    prompt: `"${meaning}" 을(를) 뜻하는 영어 단어는?`,
    accept: [word],
    explanation: `${word} — ${meaning}`,
    hint: `${word[0]}${'_'.repeat(Math.max(0, word.length - 1))}`,
  };
}
