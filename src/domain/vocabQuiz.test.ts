import { describe, expect, it } from 'vitest';
import type { VocabItem } from '@/content/schema';
import { blankOut, buildVocabQuiz } from './vocabQuiz';

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

  it('단어 수만큼 문항을 만든다', () => {
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
