import type { Question } from '@/content/schema';

export type Response =
  | { kind: 'choice'; index: number }
  | { kind: 'write'; text: string }
  | { kind: 'free'; text: string };

/**
 * 단답 비교용 정규화.
 * 대소문자·문장부호·겹공백을 무시한다. 중3 학생이 마침표를 빠뜨렸다고
 * 오답 처리하면 학습 동기만 깎이기 때문이다.
 */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"'’”“()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 자기 서술(free)은 채점하지 않는다. 여기서는 항상 true를 돌려준다. */
export function isCorrect(question: Question, response: Response | undefined): boolean {
  if (!response) return false;
  switch (question.kind) {
    case 'choice':
      return response.kind === 'choice' && response.index === question.answer;
    case 'write': {
      if (response.kind !== 'write') return false;
      const given = normalizeAnswer(response.text);
      if (!given) return false;
      return question.accept.some((a) => normalizeAnswer(a) === given);
    }
    case 'free':
      return true;
  }
}

/** 채점 대상 문항인지 (free는 제외) */
export function isGraded(question: Question): boolean {
  return question.kind !== 'free';
}

export interface ScoreResult {
  correct: number;
  total: number;
  /** 0~100. 채점 대상이 없으면 100 */
  percent: number;
  wrongIds: string[];
}

export function scoreQuestions(
  questions: Question[],
  responses: Record<string, Response | undefined>,
): ScoreResult {
  const graded = questions.filter(isGraded);
  const wrongIds: string[] = [];
  let correct = 0;
  for (const q of graded) {
    if (isCorrect(q, responses[q.id])) correct += 1;
    else wrongIds.push(q.id);
  }
  return {
    correct,
    total: graded.length,
    percent: graded.length === 0 ? 100 : Math.round((correct / graded.length) * 100),
    wrongIds,
  };
}
