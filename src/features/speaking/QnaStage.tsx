import { useState } from 'react';
import type { SpeakingBlock } from '@/content/schema';
import { useSpeech } from '@/hooks/useSpeech';

interface Props {
  qna: SpeakingBlock['qna'];
  count: number;
  onCount: (count: number) => void;
  onDone: () => void;
}

/**
 * ③ 질문에 답하기 3분
 * 한 문장으로 답해도 성공이다. 길게 말하라고 하지 않는다.
 */
export default function QnaStage({ qna, count, onCount, onDone }: Props) {
  const speech = useSpeech();
  const [index, setIndex] = useState(0);
  const [showSample, setShowSample] = useState(false);
  const item = qna[index];

  const answered = () => {
    onCount(Math.max(count, index + 1));
    setShowSample(false);
    if (index + 1 < qna.length) setIndex(index + 1);
  };

  return (
    <div className="stack">
      <div className="note note--tip">
        <strong>한 문장으로 답해도 성공</strong>이에요. 길게 말하지 않아도 괜찮아요.
      </div>

      <div className="card card--flat stack">
        <p className="tiny">
          질문 {index + 1} / {qna.length}
        </p>
        <p className="pattern" style={{ background: 'transparent', padding: 0 }}>
          {item.question}
        </p>
        <div className="row">
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            disabled={!speech.supported}
            onClick={() => speech.speak(item.question, { rate: 0.85 })}
          >
            🔊 질문 듣기
          </button>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => setShowSample((s) => !s)}
          >
            {showSample ? '예시 접기' : '막히면 예시 보기'}
          </button>
        </div>
        {showSample && (
          <div className="note">
            <span className="en">{item.sample}</span>
          </div>
        )}
      </div>

      <div className="row">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={index === 0}
          onClick={() => {
            setShowSample(false);
            setIndex((i) => Math.max(0, i - 1));
          }}
        >
          이전 질문
        </button>
        <button type="button" className="btn btn--primary" onClick={answered}>
          대답했어요
        </button>
        <div className="topbar__spacer" />
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          {count >= 3 ? '다음 단계로' : '건너뛰기'}
        </button>
      </div>

      <div className="counter" aria-label={`${qna.length}개 중 ${count}개 대답`}>
        {qna.map((q, i) => (
          <button
            key={q.question}
            type="button"
            className={`counter__dot ${i < count ? 'is-on' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`${i + 1}번 질문으로`}
          />
        ))}
      </div>
    </div>
  );
}
