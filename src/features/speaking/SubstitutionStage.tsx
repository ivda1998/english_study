import { Fragment, useMemo, useState } from 'react';
import type { SpeakingBlock } from '@/content/schema';
import { useSpeech } from '@/hooks/useSpeech';

interface Props {
  substitution: SpeakingBlock['substitution'];
  count: number;
  onCount: (count: number) => void;
  onDone: () => void;
}

const GOAL = 5;

/**
 * ② 문장 바꿔 말하기 3분
 * 한 부분만 바꿔 말한다. 외운 문장에서 자기 문장으로 넘어가는 다리 역할.
 */
export default function SubstitutionStage({ substitution, count, onCount, onDone }: Props) {
  const speech = useSpeech();
  const [picked, setPicked] = useState<Record<string, string>>(() =>
    Object.fromEntries(substitution.slots.map((s) => [s.key, s.options[0]])),
  );

  const parts = useMemo(() => substitution.pattern.split(/(\{\w+\})/g), [substitution.pattern]);
  const sentence = useMemo(
    () => parts.map((p) => (p.match(/^\{(\w+)\}$/) ? (picked[p.slice(1, -1)] ?? p) : p)).join(''),
    [parts, picked],
  );

  return (
    <div className="stack">
      <div className="note note--tip">
        한 부분만 바꿔서 말해보세요. <strong>3~5번</strong>이면 충분해요.
      </div>

      <p className="pattern">
        {parts.map((part, i) => {
          const key = part.match(/^\{(\w+)\}$/)?.[1];
          return key ? (
            <span key={i} className="pattern__slot">
              {picked[key]}
            </span>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          );
        })}
      </p>

      {substitution.slots.map((slot) => (
        <div key={slot.key} className="stack stack--sm">
          <p className="tiny">{slot.key} 바꾸기</p>
          <div className="slot-options">
            {slot.options.map((option) => (
              <button
                key={option}
                type="button"
                className={`slot-option ${picked[slot.key] === option ? 'is-active' : ''}`}
                onClick={() => setPicked((prev) => ({ ...prev, [slot.key]: option }))}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="row">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={!speech.supported}
          onClick={() => speech.speak(sentence, { rate: 0.85 })}
        >
          🔊 들어보기
        </button>
        <button type="button" className="btn btn--primary" onClick={() => onCount(count + 1)}>
          말했어요 ({count}/{GOAL})
        </button>
      </div>

      <div className="counter" aria-label={`${GOAL}번 중 ${count}번 말함`}>
        {Array.from({ length: GOAL }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`counter__dot ${i < count ? 'is-on' : ''}`}
            onClick={() => onCount(i + 1)}
            aria-label={`${i + 1}번째`}
          />
        ))}
      </div>

      <details>
        <summary className="tiny">이렇게 바꿀 수도 있어요</summary>
        <ul className="stack stack--sm" style={{ marginTop: 'var(--sp-2)' }}>
          {substitution.examples.map((ex) => (
            <li key={ex} className="speak-line">
              <span className="speak-line__text">{ex}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="row">
        <div className="topbar__spacer" />
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          {count >= 3 ? '다음 단계로' : '건너뛰기'}
        </button>
      </div>
    </div>
  );
}
