import { describe, expect, it } from 'vitest';
import type { Question } from '@/content/schema';
import { isCorrect, normalizeAnswer, scoreQuestions } from './grading';

const choice: Question = {
  kind: 'choice',
  id: 'q1',
  prompt: '무엇이 맞나요?',
  options: ['a', 'b', 'c'],
  answer: 1,
  explanation: '두 번째가 맞습니다.',
};

const write: Question = {
  kind: 'write',
  id: 'q2',
  prompt: '빈칸을 채우세요',
  accept: ['has lived', 'has been living'],
  explanation: '현재완료입니다.',
};

const free: Question = {
  kind: 'free',
  id: 'q3',
  prompt: '한 문장으로 요약해 보세요',
  sample: 'The writer says math is useful.',
};

describe('채점', () => {
  it('대소문자와 문장부호는 무시한다', () => {
    expect(normalizeAnswer('  Has Lived. ')).toBe('has lived');
    expect(isCorrect(write, { kind: 'write', text: 'HAS LIVED!' })).toBe(true);
    expect(isCorrect(write, { kind: 'write', text: 'has been living' })).toBe(true);
  });

  it('빈 답은 오답이다', () => {
    expect(isCorrect(write, { kind: 'write', text: '   ' })).toBe(false);
    expect(isCorrect(choice, undefined)).toBe(false);
  });

  it('객관식은 인덱스로 비교한다', () => {
    expect(isCorrect(choice, { kind: 'choice', index: 1 })).toBe(true);
    expect(isCorrect(choice, { kind: 'choice', index: 0 })).toBe(false);
  });

  it('자기 서술은 채점하지 않고 항상 통과시킨다', () => {
    expect(isCorrect(free, { kind: 'free', text: '아무거나' })).toBe(true);
  });

  it('점수 계산에서 자기 서술 문항은 분모에서 빠진다', () => {
    const result = scoreQuestions([choice, write, free], {
      q1: { kind: 'choice', index: 1 },
      q2: { kind: 'write', text: '틀린답' },
    });
    expect(result).toEqual({ correct: 1, total: 2, percent: 50, wrongIds: ['q2'] });
  });

  it('채점 대상이 없으면 100점', () => {
    expect(scoreQuestions([free], {}).percent).toBe(100);
  });
});
