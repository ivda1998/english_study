import { useMemo, useState } from 'react';
import QuestionSet from '@/components/QuestionSet';
import { buildVocabQuiz } from '@/domain/vocabQuiz';
import { useSpeech } from '@/hooks/useSpeech';
import { registerVocab } from '@/store/actions';
import type { BlockProps } from './types';

type Phase = 'learn' | 'quiz';

/**
 * 어휘 15분: 그날 단어를 한 장씩 넘겨 보고(뜻·예문·발음), 바로 문제로 확인한다.
 * 문제는 그날 단어에서 자동으로 만들어지고, 단어가 많아도 문항 수는 늘지 않는다.
 *
 * 15분에 30장을 넘기려면 한 장에 오래 머물면 안 된다. 그래서 카드에서 바로
 * 뜻을 보여주고(가리기는 선택), 언제든 문제로 건너뛸 수 있게 열어 둔다.
 */
export default function VocabBlock({ day, onDone }: BlockProps) {
  const [phase, setPhase] = useState<Phase>('learn');
  const [index, setIndex] = useState(0);
  // 뜻을 처음부터 보여준다. 30장을 넘기는데 장마다 한 번 더 누르게 하면 시간이 다 간다.
  const [revealed, setRevealed] = useState(true);
  const speech = useSpeech();
  const quiz = useMemo(() => buildVocabQuiz(day.id, day.vocab), [day]);

  const item = day.vocab[index];

  if (phase === 'quiz') {
    return (
      <div className="card stack">
        <h2 className="section-title">단어 확인</h2>
        <QuestionSet
          questions={quiz}
          finishLabel="어휘 끝내기"
          onComplete={(result) => {
            registerVocab(day);
            onDone({ score: { correct: result.correct, total: result.total }, wrong: result.wrong });
          }}
        />
      </div>
    );
  }

  return (
    <div className="card stack">
      <div className="row row--between">
        <h2 className="section-title">오늘의 단어</h2>
        <span className="tiny">
          {index + 1} / {day.vocab.length}
        </span>
      </div>

      <div className="flashcard">
        <div>
          <p className="flashcard__word">{item.word}</p>
          <p className="flashcard__pos">{item.pos}</p>
        </div>
        {revealed ? (
          <>
            <p className="flashcard__meaning">{item.meaning}</p>
            <p className="flashcard__example">{item.example}</p>
            <p className="tiny">{item.exampleKo}</p>
          </>
        ) : (
          <p className="tiny">뜻을 떠올려 본 다음 눌러보세요.</p>
        )}
      </div>

      <div className="row">
        <button type="button" className="btn btn--ghost" onClick={() => setRevealed((r) => !r)}>
          {revealed ? '뜻 가리기' : '뜻 보기'}
        </button>
        {speech.supported && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => speech.speak([item.word, item.example])}
          >
            🔊 들어보기
          </button>
        )}
        <div className="topbar__spacer" />
        <button
          type="button"
          className="btn btn--ghost"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          이전
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={index + 1 >= day.vocab.length}
          onClick={() => setIndex((i) => Math.min(day.vocab.length - 1, i + 1))}
        >
          다음 단어
        </button>
      </div>

      {/* 끝까지 안 넘겨도 문제로 갈 수 있다. 남은 단어는 복습에서 다시 만난다. */}
      <button type="button" className="btn btn--primary" onClick={() => setPhase('quiz')}>
        문제 풀기
      </button>

      <details>
        <summary className="tiny">{day.vocab.length}개 한눈에 보기</summary>
        <ul className="vocab-list" style={{ marginTop: 'var(--sp-3)' }}>
          {day.vocab.map((w) => (
            <li key={w.word} className="vocab-list__row">
              <span className="vocab-list__word">{w.word}</span>
              <span className="muted">{w.meaning}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
