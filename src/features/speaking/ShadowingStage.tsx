import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface Props {
  sentences: string[];
  onDone: () => void;
}

/**
 * ① 따라 읽기 3분
 * 듣기 → 멈추기 → 따라 읽기. 발음을 고치지 않는다. 소리를 내는 것 자체가 목표다.
 */
export default function ShadowingStage({ sentences, onDone }: Props) {
  const speech = useSpeech();
  const [index, setIndex] = useState(0);
  const [repeated, setRepeated] = useState<boolean[]>(() => sentences.map(() => false));

  const markRepeated = () => {
    setRepeated((prev) => prev.map((v, i) => (i === index ? true : v)));
    if (index + 1 < sentences.length) setIndex(index + 1);
  };

  const allDone = repeated.every(Boolean);

  return (
    <div className="stack">
      <div className="note note--tip">
        정확하게 말고, <strong>소리를 내는 것</strong>이 목표예요. 발음이 어색해도 그냥 넘어가세요.
      </div>

      {!speech.supported && (
        <div className="note note--warn">
          이 브라우저는 음성 읽기를 지원하지 않아요. 문장을 눈으로 보고 소리 내어 읽어도 똑같이 좋아요.
        </div>
      )}

      <ul className="stack stack--sm">
        {sentences.map((sentence, i) => (
          <li key={sentence} className={`speak-line ${i === index ? 'is-active' : ''}`}>
            <span className="speak-line__text">{sentence}</span>
            <div className="row">
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                disabled={!speech.supported}
                onClick={() => {
                  setIndex(i);
                  speech.speak(sentence, { rate: 0.8 });
                }}
              >
                🔊 듣기
              </button>
              <span className="tiny">{repeated[i] ? '✓' : ''}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="row">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={!speech.supported}
          onClick={() => speech.speak(sentences[index], { rate: 0.7 })}
        >
          🐢 천천히 다시
        </button>
        <button type="button" className="btn btn--primary" onClick={markRepeated}>
          따라 읽었어요
        </button>
        <div className="topbar__spacer" />
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          {allDone ? '다음 단계로' : '건너뛰기'}
        </button>
      </div>
    </div>
  );
}
