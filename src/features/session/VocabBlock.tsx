import { useMemo, useState } from 'react';
import QuestionSet from '@/components/QuestionSet';
import { buildVocabQuiz } from '@/domain/vocabQuiz';
import { useSpeech } from '@/hooks/useSpeech';
import { registerVocab } from '@/store/actions';
import type { BlockProps } from './types';

type Phase = 'learn' | 'quiz';

/**
 * 어휘 15분: 단어 10개를 한 장씩 넘겨 보고(뜻·예문·발음), 바로 10문제로 확인한다.
 * 문제는 그날 단어에서 자동으로 만들어진다.
 */
export default function VocabBlock({ day, onDone }: BlockProps) {
  const [phase, setPhase] = useState<Phase>('learn');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
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
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setRevealed(false);
          }}
        >
          이전
        </button>
        {index + 1 < day.vocab.length ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setIndex((i) => i + 1);
              setRevealed(false);
            }}
          >
            다음 단어
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={() => setPhase('quiz')}>
            문제 풀기
          </button>
        )}
      </div>

      <details>
        <summary className="tiny">10개 한눈에 보기</summary>
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
