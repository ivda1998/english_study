import { useState } from 'react';
import QuestionSet from '@/components/QuestionSet';
import RichText from '@/components/RichText';
import { splitParagraphs } from '@/domain/curriculum';
import { stripMarkup } from '@/domain/markup';
import { useSpeech } from '@/hooks/useSpeech';
import type { BlockProps } from './types';

/**
 * 독해 15분: 지문을 읽고 문항을 푼다.
 * 해석은 다 푼 뒤에만 열리도록 접어둔다 — 먼저 스스로 생각하게 하려는 것이다.
 */
export default function ReadingBlock({ day, onDone }: BlockProps) {
  const [phase, setPhase] = useState<'read' | 'quiz'>('read');
  const [showTranslation, setShowTranslation] = useState(false);
  const speech = useSpeech();
  const { passage, questions } = day.reading;
  const paragraphs = splitParagraphs(passage.body);

  return (
    <div className="card stack">
      <div className="stack stack--sm">
        <p className="eyebrow">{passage.topic}</p>
        <h2 className="section-title">{passage.title}</h2>
      </div>

      <div className="passage">
        {paragraphs.map((p, i) => (
          <p key={i}>
            <RichText>{p}</RichText>
          </p>
        ))}
      </div>

      <div className="glossary">
        {passage.glossary.map((g) => (
          <span key={g.word} className="glossary__item">
            <b>{g.word}</b> {g.meaning}
          </span>
        ))}
      </div>

      {/* 지문은 직접 쓴 글이다. 소재가 실제 연구라면 어디에 기댔는지 밝힌다. */}
      {passage.source && (
        <p className="source">
          <span className="source__label">근거</span>
          {passage.source.url ? (
            <a href={passage.source.url} target="_blank" rel="noreferrer noopener">
              {passage.source.label}
            </a>
          ) : (
            passage.source.label
          )}
        </p>
      )}

      <div className="row">
        {speech.supported && (
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() =>
              speech.speaking ? speech.stop() : speech.speak(paragraphs.map(stripMarkup))
            }
          >
            {speech.speaking ? '■ 멈추기' : '🔊 지문 듣기'}
          </button>
        )}
        {phase === 'quiz' && (
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => setShowTranslation((s) => !s)}
          >
            {showTranslation ? '해석 접기' : '해석 보기'}
          </button>
        )}
      </div>

      {showTranslation && (
        <div className="note" style={{ whiteSpace: 'pre-wrap' }}>
          {passage.translation}
        </div>
      )}

      {phase === 'read' ? (
        <button type="button" className="btn btn--primary" onClick={() => setPhase('quiz')}>
          다 읽었어요 · 문제 풀기
        </button>
      ) : (
        <QuestionSet
          questions={questions}
          finishLabel="독해 끝내기"
          onComplete={(result) =>
            onDone({ score: { correct: result.correct, total: result.total }, wrong: result.wrong })
          }
        />
      )}
    </div>
  );
}
