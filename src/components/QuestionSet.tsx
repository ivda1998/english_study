import { useMemo, useState } from 'react';
import RichText from '@/components/RichText';
import type { Question } from '@/content/schema';
import { isCorrect, isGraded, type Response } from '@/domain/grading';

export interface QuestionSetResult {
  correct: number;
  total: number;
  wrong: { question: Question; myAnswer: string }[];
}

interface Props {
  questions: Question[];
  /** 다 풀었을 때 */
  onComplete: (result: QuestionSetResult) => void;
  /** 마지막 버튼 문구 */
  finishLabel?: string;
}

function answerText(question: Question, response: Response | undefined): string {
  if (!response) return '';
  if (response.kind === 'choice') {
    return question.kind === 'choice' ? (question.options[response.index] ?? '') : '';
  }
  return response.text;
}

/**
 * 문항을 한 번에 하나씩 보여준다.
 * 답을 확인하면 곧바로 해설을 보여주고, 틀린 문항은 오답 노트로 넘긴다.
 */
export default function QuestionSet({ questions, onComplete, finishLabel = '끝내기' }: Props) {
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);

  const question = questions[index];
  const response = question ? responses[question.id] : undefined;
  const isRevealed = question ? Boolean(revealed[question.id]) : false;
  const correct = question ? isCorrect(question, response) : false;

  const answered = useMemo(
    () => questions.filter((q) => revealed[q.id]).length,
    [questions, revealed],
  );

  if (!question) return null;

  const canCheck =
    question.kind === 'choice'
      ? response?.kind === 'choice'
      : question.kind === 'write'
        ? (response?.kind === 'write' && response.text.trim().length > 0)
        : true;

  const reveal = () => {
    setRevealed((prev) => ({ ...prev, [question.id]: true }));
  };

  const goNext = () => {
    setShowHint(false);
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      return;
    }
    const graded = questions.filter(isGraded);
    const wrong = graded
      .filter((q) => !isCorrect(q, responses[q.id]))
      .map((q) => ({ question: q, myAnswer: answerText(q, responses[q.id]) || '(답 없음)' }));
    onComplete({
      correct: graded.length - wrong.length,
      total: graded.length,
      wrong,
    });
  };

  return (
    <div className="qset">
      <div className="qset__head">
        <span className="tiny">
          {index + 1} / {questions.length}
        </span>
        <div className="bar qset__bar">
          <div className="bar__fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
      </div>

      <p className="qset__prompt">
        <RichText>{question.prompt}</RichText>
      </p>

      {question.kind === 'choice' && (
        <ul className="qset__options">
          {question.options.map((option, i) => {
            const selected = response?.kind === 'choice' && response.index === i;
            const isAnswer = i === question.answer;
            const state = !isRevealed
              ? selected
                ? 'is-selected'
                : ''
              : isAnswer
                ? 'is-correct'
                : selected
                  ? 'is-wrong'
                  : '';
            return (
              <li key={option}>
                <button
                  type="button"
                  className={`qset__option ${state}`}
                  disabled={isRevealed}
                  aria-pressed={selected}
                  onClick={() =>
                    setResponses((prev) => ({ ...prev, [question.id]: { kind: 'choice', index: i } }))
                  }
                >
                  <span className="qset__marker">{'①②③④⑤'[i] ?? i + 1}</span>
                  <span>
                    <RichText>{option}</RichText>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {question.kind === 'write' && (
        <div className="stack stack--sm">
          <input
            className="input"
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="답을 적어보세요"
            disabled={isRevealed}
            value={response?.kind === 'write' ? response.text : ''}
            onChange={(e) =>
              setResponses((prev) => ({
                ...prev,
                [question.id]: { kind: 'write', text: e.target.value },
              }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canCheck && !isRevealed) reveal();
            }}
          />
          {question.hint && !isRevealed && (
            <div className="row">
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => setShowHint((s) => !s)}>
                {showHint ? '힌트 접기' : '힌트 보기'}
              </button>
              {showHint && <code className="qset__hint">{question.hint}</code>}
            </div>
          )}
        </div>
      )}

      {question.kind === 'free' && (
        <div className="stack stack--sm">
          <textarea
            className="textarea"
            placeholder="한국어로 적어도 좋아요. 짧아도 괜찮아요."
            value={response?.kind === 'free' ? response.text : ''}
            onChange={(e) =>
              setResponses((prev) => ({
                ...prev,
                [question.id]: { kind: 'free', text: e.target.value },
              }))
            }
          />
          <p className="tiny">이 문제는 채점하지 않아요. 생각을 정리하는 게 목적이에요.</p>
        </div>
      )}

      {isRevealed && (
        <div className={`qset__feedback ${question.kind === 'free' ? 'is-neutral' : correct ? 'is-correct' : 'is-wrong'}`}>
          <strong>
            {question.kind === 'free' ? '이렇게 쓸 수도 있어요' : correct ? '맞았어요' : '다시 볼까요'}
          </strong>
          {question.kind === 'free' ? (
            <p className="en">{question.sample}</p>
          ) : (
            <>
              {!correct && (
                <p>
                  정답:{' '}
                  <strong>
                    <RichText>
                      {question.kind === 'choice'
                        ? (question.options[question.answer] ?? '')
                        : question.accept[0]}
                    </RichText>
                  </strong>
                </p>
              )}
              <p className="qset__explanation">{question.explanation}</p>
            </>
          )}
        </div>
      )}

      <div className="row row--between qset__foot">
        {!isRevealed ? (
          <button type="button" className="btn btn--primary" disabled={!canCheck} onClick={reveal}>
            확인
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={goNext}>
            {index + 1 < questions.length ? '다음 문제' : finishLabel}
          </button>
        )}
      </div>
    </div>
  );
}
