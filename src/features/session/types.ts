import type { Day, Question } from '@/content/schema';

export interface BlockResult {
  score?: { correct: number; total: number };
  wrong?: { question: Question; myAnswer: string }[];
}

export interface BlockProps {
  day: Day;
  onDone: (result: BlockResult) => void;
}
