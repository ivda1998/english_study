import { useState } from 'react';
import QuestionSet from '@/components/QuestionSet';
import type { BlockProps } from './types';

/**
 * 문법 15~20분: 포인트 하나를 설명으로 이해하고, 5~6문제로 확인한다.
 * 설명을 먼저 읽게 하고 문제로 넘어가는 순서를 강제하지는 않는다.
 */
export default function GrammarBlock({ day, onDone }: BlockProps) {
  const [phase, setPhase] = useState<'learn' | 'quiz'>('learn');
  const { grammar } = day;

  if (phase === 'quiz') {
    return (
      <div className="card stack">
        <div className="row row--between">
          <h2 className="section-title">{grammar.point}</h2>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setPhase('learn')}>
            설명 다시 보기
          </button>
        </div>
        <QuestionSet
          questions={grammar.exercises}
          finishLabel="문법 끝내기"
          onComplete={(result) =>
            onDone({ score: { correct: result.correct, total: result.total }, wrong: result.wrong })
          }
        />
      </div>
    );
  }

  return (
    <div className="card stack">
      <p className="eyebrow">오늘의 문법</p>
      <h2 className="section-title">{grammar.point}</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{grammar.explanation}</p>

      <ul className="stack stack--sm">
        {grammar.examples.map((ex) => (
          <li key={ex.en} className="note">
            <p className="en" style={{ fontSize: 16, color: 'var(--text)' }}>
              {ex.en}
            </p>
            <p className="tiny">{ex.ko}</p>
          </li>
        ))}
      </ul>

      <button type="button" className="btn btn--primary" onClick={() => setPhase('quiz')}>
        문제 풀기 ({grammar.exercises.length}문항)
      </button>
    </div>
  );
}
