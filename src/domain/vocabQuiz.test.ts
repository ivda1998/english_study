import { describe, expect, it } from 'vitest';
import type { VocabItem } from '@/content/schema';
import { blankOut, buildVocabQuiz, QUIZ_SIZE } from './vocabQuiz';

const items: VocabItem[] = [
  { word: 'solve', pos: 'v.', meaning: '풀다', example: 'I solved the problem.', exampleKo: '나는 그 문제를 풀었다.' },
  { word: 'proud', pos: 'adj.', meaning: '자랑스러운', example: 'I am proud of you.', exampleKo: '네가 자랑스러워.' },
  { word: 'subject', pos: 'n.', meaning: '과목', example: 'Math is my favorite subject.', exampleKo: '수학은 내가 가장 좋아하는 과목이다.' },
  { word: 'useful', pos: 'adj.', meaning: '유용한', example: 'English is useful.', exampleKo: '영어는 유용하다.' },
  { word: 'reason', pos: 'n.', meaning: '이유', example: 'Tell me the reason.', exampleKo: '이유를 말해줘.' },
  { word: 'improve', pos: 'v.', meaning: '향상시키다', example: 'I want to improve my English.', exampleKo: '영어를 향상시키고 싶다.' },
  { word: 'effort', pos: 'n.', meaning: '노력', example: 'Effort matters more than talent.', exampleKo: '노력이 재능보다 중요하다.' },
  { word: 'explain', pos: 'v.', meaning: '설명하다', example: 'Can you explain it again?', exampleKo: '다시 설명해 줄래?' },
  { word: 'difficult', pos: 'adj.', meaning: '어려운', example: 'The test was difficult.', exampleKo: '시험이 어려웠다.' },
  { word: 'practice', pos: 'n.', meaning: '연습', example: 'Practice makes perfect.', exampleKo: '연습이 완벽을 만든다.' },
];

describe('어휘 퀴즈 자동 생성', () => {
  const quiz = buildVocabQuiz('w01d1', items);

  it('단어가 문항 수보다 적거나 같으면 전부 묻는다', () => {
    expect(quiz).toHaveLength(10);
  });

  it('모든 문항의 정답 인덱스가 보기 범위 안에 있다', () => {
    for (const q of quiz) {
      expect(q.kind).toBe('choice');
      if (q.kind !== 'choice') continue;
      expect(q.options.length).toBe(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });

  it('같은 입력이면 항상 같은 문제가 나온다', () => {
    expect(buildVocabQuiz('w01d1', items)).toEqual(quiz);
  });

  it('날짜가 다르면 문제 순서가 달라진다', () => {
    expect(buildVocabQuiz('w02d1', items)).not.toEqual(quiz);
  });

  it('뒤쪽 5문항은 예문 빈칸 문제다', () => {
    for (const q of quiz.slice(5)) {
      expect(q.prompt).toContain('_______');
    }
  });

  it('빈칸 처리는 굴절형도 가린다', () => {
    expect(blankOut('I solved the problem.', 'solve')).toBe('I _______ the problem.');
    expect(blankOut('She practices every day.', 'practice')).toBe('She _______ every day.');
  });

  it('표제어가 예문에 없으면 원문을 그대로 둔다', () => {
    expect(blankOut('Nothing matches here.', 'zebra')).toBe('Nothing matches here.');
  });
});

const WORDS = [
  'method', 'balance', 'signal', 'purpose', 'attempt', 'measure', 'concern', 'quality',
  'benefit', 'pattern', 'contrast', 'evidence', 'motive', 'outcome', 'pressure', 'reaction',
  'standard', 'tendency', 'variety', 'approach', 'capacity', 'decline', 'estimate', 'factor',
  'gesture', 'impulse', 'notion', 'origin', 'portion', 'remark',
];

describe('단어가 하루 문항 수보다 많을 때', () => {
  // 하루 30개짜리 주차를 흉내낸다. 단어마다 예문이 달라야 빈칸 문제도 서로 달라진다.
  const many: VocabItem[] = Array.from({ length: 30 }, (_, i) => ({
    word: WORDS[i],
    pos: 'n.',
    meaning: `뜻${i}`,
    example: `The ${WORDS[i]} came up in class ${i}.`,
    exampleKo: `${i}번 수업에서 나왔다.`,
  }));
  const quiz = buildVocabQuiz('w01d1', many);

  it('문항 수를 QUIZ_SIZE로 묶는다', () => {
    expect(quiz).toHaveLength(QUIZ_SIZE);
  });

  it('같은 날이면 늘 같은 단어를 묻는다', () => {
    expect(buildVocabQuiz('w01d1', many)).toEqual(quiz);
  });

  it('날이 다르면 고르는 단어도 달라진다', () => {
    const other = buildVocabQuiz('w01d2', many);
    const asked = (qs: typeof quiz) => qs.map((q) => q.explanation).sort();
    expect(asked(other)).not.toEqual(asked(quiz));
  });

  it('같은 단어를 두 번 묻지 않는다', () => {
    const prompts = quiz.map((q) => q.prompt);
    expect(new Set(prompts).size).toBe(prompts.length);
  });

  it('절반은 뜻 고르기, 절반은 빈칸이다', () => {
    expect(quiz.slice(0, QUIZ_SIZE / 2).every((q) => q.prompt.includes('의 뜻은?'))).toBe(true);
    expect(quiz.slice(QUIZ_SIZE / 2).every((q) => q.prompt.includes('_______'))).toBe(true);
  });

  it('보기는 4개이고 정답이 그 안에 있다', () => {
    for (const q of quiz) {
      if (q.kind !== 'choice') throw new Error('객관식이어야 합니다');
      expect(q.options).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
    }
  });
});
