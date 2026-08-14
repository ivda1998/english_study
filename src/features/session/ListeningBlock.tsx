import { useMemo, useState } from 'react';
import QuestionSet from '@/components/QuestionSet';
import type { Question } from '@/content/schema';
import { splitSentences } from '@/domain/curriculum';
import { normalizeAnswer } from '@/domain/grading';
import { useSpeech } from '@/hooks/useSpeech';
import type { BlockProps } from './types';

type Phase = 'listen' | 'quiz' | 'dictation' | 'done';

/**
 * 듣기 10분: 스크립트를 보지 않고 들은 뒤 문항을 풀고, 마지막에 두 문장 받아쓰기를 한다.
 * 받아쓰기는 대소문자·문장부호를 따지지 않는다.
 */
export default function ListeningBlock({ day, onDone }: BlockProps) {
  const [phase, setPhase] = useState<Phase>('listen');
  const [plays, setPlays] = useState(0);
  const [showScript, setShowScript] = useState(false);
  const speech = useSpeech();
  const { listening } = day;

  const dictationLines = useMemo(() => {
    if (listening.dictation?.length) return listening.dictation;
    // 따로 지정하지 않았으면 지문 앞부분에서 두 문장을 가져온다.
    return splitSentences(day.reading.passage.body).slice(0, 2);
  }, [listening.dictation, day.reading.passage.body]);

  const [dictIndex, setDictIndex] = useState(0);
  const [dictInput, setDictInput] = useState('');
  const [dictChecked, setDictChecked] = useState(false);
  const [dictScore, setDictScore] = useState({ correct: 0, total: 0 });
  const [quizResult, setQuizResult] = useState<{
    correct: number;
    total: number;
    wrong: { question: Question; myAnswer: string }[];
  } | null>(null);

  // 화자를 그대로 넘겨야 목소리가 갈린다. 대화가 한 사람 독백처럼 들리면 안 된다.
  const play = () => {
    setPlays((p) => p + 1);
    speech.speak(listening.script, { gapMs: 350 });
  };

  /** 지금 말하고 있는 사람. 스크립트를 숨긴 채로도 누구 차례인지는 보여준다. */
  const nowSpeaking =
    speech.speaking && speech.index >= 0 ? listening.script[speech.index]?.speaker : undefined;

  if (phase === 'listen') {
    return (
      <div className="card stack">
        <p className="eyebrow">듣기</p>
        <h2 className="section-title">{listening.intro}</h2>

        {!speech.supported && (
          <div className="note note--warn">
            이 브라우저는 음성 읽기를 지원하지 않아요. 아래 스크립트를 소리 내어 읽어보고 문제를 풀어도 괜찮아요.
          </div>
        )}

        <div className="mic">
          <p className="tiny">들은 횟수 {plays}회</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => (speech.speaking ? speech.stop() : play())}
            disabled={!speech.supported}
          >
            {speech.speaking ? '■ 멈추기' : plays === 0 ? '▶ 듣기 시작' : '▶ 다시 듣기'}
          </button>
          {nowSpeaking ? (
            <p className="speaker-now">
              <span className="speaker-now__dot" aria-hidden="true" />
              {nowSpeaking} 말하는 중
            </p>
          ) : (
            <p className="tiny">두세 번 들어도 괜찮아요. 다 못 들려도 괜찮아요.</p>
          )}
        </div>

        {(showScript || !speech.supported) && (
          <ul className="stack stack--sm">
            {listening.script.map((line, i) => (
              <li key={i} className={`speak-line ${speech.index === i ? 'is-active' : ''}`}>
                {line.speaker && <strong className="tiny">{line.speaker}</strong>}
                <span className="speak-line__text">{line.text}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="row">
          {speech.supported && (
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => setShowScript((s) => !s)}
            >
              {showScript ? '스크립트 접기' : '스크립트 보기'}
            </button>
          )}
          <div className="topbar__spacer" />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              speech.stop();
              setPhase('quiz');
            }}
          >
            문제 풀기
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    return (
      <div className="card stack">
        <div className="row row--between">
          <h2 className="section-title">들은 내용 확인</h2>
          <button type="button" className="btn btn--sm btn--ghost" onClick={play} disabled={!speech.supported}>
            🔊 다시 듣기
          </button>
        </div>
        <QuestionSet
          questions={listening.questions}
          finishLabel="받아쓰기로"
          onComplete={(result) => {
            setQuizResult(result);
            setPhase('dictation');
          }}
        />
      </div>
    );
  }

  if (phase === 'dictation') {
    const target = dictationLines[dictIndex];
    const correct = normalizeAnswer(dictInput) === normalizeAnswer(target);
    return (
      <div className="card stack">
        <p className="eyebrow">받아쓰기 {dictIndex + 1} / {dictationLines.length}</p>
        <h2 className="section-title">들리는 대로 적어보세요</h2>

        <div className="row">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => speech.speak(target, { rate: 0.8 })}
            disabled={!speech.supported}
          >
            ▶ 문장 듣기
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => speech.speak(target, { rate: 0.6 })}
            disabled={!speech.supported}
          >
            🐢 천천히
          </button>
        </div>

        <textarea
          className="textarea"
          style={{ minHeight: 90, fontFamily: 'var(--font-reading)', fontSize: 16 }}
          value={dictInput}
          disabled={dictChecked}
          placeholder="들은 문장을 적어보세요"
          onChange={(e) => setDictInput(e.target.value)}
        />

        {dictChecked && (
          <div className={`qset__feedback ${correct ? 'is-correct' : 'is-wrong'}`}>
            <strong>{correct ? '정확히 들었어요' : '이렇게 말했어요'}</strong>
            <p className="en">{target}</p>
          </div>
        )}

        {!dictChecked ? (
          <button
            type="button"
            className="btn btn--primary"
            disabled={dictInput.trim().length === 0}
            onClick={() => {
              setDictChecked(true);
              setDictScore((s) => ({
                correct: s.correct + (correct ? 1 : 0),
                total: s.total + 1,
              }));
            }}
          >
            확인
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              speech.stop();
              if (dictIndex + 1 < dictationLines.length) {
                setDictIndex((i) => i + 1);
                setDictInput('');
                setDictChecked(false);
              } else {
                setPhase('done');
              }
            }}
          >
            {dictIndex + 1 < dictationLines.length ? '다음 문장' : '듣기 끝내기'}
          </button>
        )}
      </div>
    );
  }

  // done
  const total = (quizResult?.total ?? 0) + dictScore.total;
  const correctCount = (quizResult?.correct ?? 0) + dictScore.correct;
  return (
    <div className="card stack">
      <h2 className="section-title">듣기 끝</h2>
      <p className="muted">
        문제 {quizResult?.correct ?? 0}/{quizResult?.total ?? 0} · 받아쓰기 {dictScore.correct}/
        {dictScore.total}
      </p>
      <details>
        <summary className="tiny">스크립트 다시 보기</summary>
        <ul className="stack stack--sm" style={{ marginTop: 'var(--sp-3)' }}>
          {listening.script.map((line, i) => (
            <li key={i} className="speak-line">
              {line.speaker && <strong className="tiny">{line.speaker}</strong>}
              <span className="speak-line__text">{line.text}</span>
            </li>
          ))}
        </ul>
      </details>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() =>
          onDone({ score: { correct: correctCount, total }, wrong: quizResult?.wrong ?? [] })
        }
      >
        말하기로 넘어가기
      </button>
    </div>
  );
}
