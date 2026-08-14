import { useMemo, useState } from 'react';
import QuestionSet from '@/components/QuestionSet';
import RichText from '@/components/RichText';
import { toISODate } from '@/domain/date';
import { boxDistribution, dueCards, masteredCount, type SrsCard } from '@/domain/srs';
import { buildRecallQuestion } from '@/domain/vocabQuiz';
import {
  addWeekendLog,
  applyVocabReview,
  clearResolvedNotes,
  resolveWrongNote,
  useAppData,
} from '@/store/actions';

const WEEKEND_IDEAS = [
  { kind: '영어로 된 수학·과학 영상', hint: '좋아하는 분야면 자막 없이도 들려요' },
  { kind: '짧은 영어 다큐', hint: '10분짜리 하나면 충분해요' },
  { kind: '영어 애니메이션', hint: '이미 아는 이야기면 더 편해요' },
  { kind: '관심 분야 영어 영상', hint: '게임, 스포츠, 뭐든 좋아요' },
  { kind: '영어책', hint: '그림이 있는 책도 좋아요' },
];

export default function ReviewPage() {
  const data = useAppData();
  const today = toISODate();
  const [mode, setMode] = useState<'menu' | 'vocab' | 'wrong'>('menu');

  const cards = useMemo(() => Object.values(data.srs), [data.srs]);
  const due = useMemo(() => dueCards(cards, today).slice(0, 20), [cards, today]);
  const unresolved = data.wrongNotes.filter((n) => !n.resolved);
  const dist = boxDistribution(cards);

  if (mode === 'vocab' && due.length > 0) {
    return <VocabReview cards={due} onExit={() => setMode('menu')} />;
  }

  if (mode === 'wrong' && unresolved.length > 0) {
    return (
      <div className="stack">
        <div className="row row--between">
          <h1 className="page-title">오답 다시 보기</h1>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setMode('menu')}>
            그만하기
          </button>
        </div>
        <ul className="stack">
          {unresolved.map((note) => (
            <li key={note.id} className="card stack stack--sm">
              <p className="tiny">
                {note.dayId} · {note.area}
              </p>
              <p style={{ whiteSpace: 'pre-wrap', fontWeight: 600 }}>
                <RichText>{note.prompt}</RichText>
              </p>
              <p className="tiny">
                내가 쓴 답: <RichText>{note.myAnswer}</RichText>
              </p>
              <p>
                정답:{' '}
                <strong>
                  <RichText>{note.correctAnswer}</RichText>
                </strong>
              </p>
              <p className="tiny" style={{ whiteSpace: 'pre-wrap' }}>
                {note.explanation}
              </p>
              <div>
                <button
                  type="button"
                  className="btn btn--sm btn--primary"
                  onClick={() => resolveWrongNote(note.id)}
                >
                  이제 알겠어요
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="stack stack--lg">
      <div className="stack stack--sm">
        <h1 className="page-title">복습</h1>
        <p className="muted">짧게 다시 보는 게 오래 기억에 남아요.</p>
      </div>

      <section className="grid grid--2">
        <div className="card stack stack--sm">
          <p className="eyebrow">오늘 복습할 단어</p>
          <p className="stat__value">{due.length}개</p>
          <p className="tiny">
            외운 단어 {masteredCount(cards)}개 / 전체 {cards.length}개
          </p>
          <div className="spark" aria-hidden="true">
            {dist.map((n, i) => (
              <div
                key={i}
                className={`spark__bar ${n === 0 ? 'is-empty' : ''}`}
                style={{ height: `${Math.max(6, (n / Math.max(1, ...dist)) * 100)}%` }}
                title={`${i + 1}번 상자: ${n}개`}
              />
            ))}
          </div>
          <p className="tiny">왼쪽일수록 최근에 헷갈린 단어예요.</p>
          <button
            type="button"
            className="btn btn--primary"
            disabled={due.length === 0}
            onClick={() => setMode('vocab')}
          >
            단어 복습 시작
          </button>
        </div>

        <div className="card stack stack--sm">
          <p className="eyebrow">오답 노트</p>
          <p className="stat__value">{unresolved.length}개</p>
          <p className="tiny">
            틀린 문제는 여기 모여요. 다시 보고 이해했으면 지워도 좋아요.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            disabled={unresolved.length === 0}
            onClick={() => setMode('wrong')}
          >
            오답 다시 보기
          </button>
          {data.wrongNotes.some((n) => n.resolved) && (
            <button type="button" className="btn btn--sm btn--ghost" onClick={clearResolvedNotes}>
              해결한 오답 지우기
            </button>
          )}
        </div>
      </section>

      <WeekendSection />
    </div>
  );
}

function VocabReview({ cards, onExit }: { cards: SrsCard[]; onExit: () => void }) {
  const questions = useMemo(
    () => cards.map((c) => buildRecallQuestion(c.id, c.word, c.meaning)),
    [cards],
  );

  return (
    <div className="stack">
      <div className="row row--between">
        <h1 className="page-title">단어 복습</h1>
        <button type="button" className="btn btn--sm btn--ghost" onClick={onExit}>
          그만하기
        </button>
      </div>
      <div className="card">
        <QuestionSet
          questions={questions}
          finishLabel="복습 끝내기"
          onComplete={(result) => {
            const wrongIds = new Set(result.wrong.map((w) => w.question.id));
            applyVocabReview(cards.map((card) => ({ card, correct: !wrongIds.has(card.id) })));
            onExit();
          }}
        />
      </div>
    </div>
  );
}

function WeekendSection() {
  const data = useAppData();
  const today = toISODate();
  const [kind, setKind] = useState(WEEKEND_IDEAS[0].kind);
  const [minutes, setMinutes] = useState(20);
  const [note, setNote] = useState('');
  const saved = data.weekend.find((w) => w.date === today);

  return (
    <section className="card stack">
      <div className="stack stack--sm">
        <h2 className="section-title">주말엔 즐기는 영어</h2>
        <p className="muted">
          토요일에는 공부하지 않아도 괜찮아요. 20~30분 정도 좋아하는 영어 콘텐츠를 즐기면 그걸로 충분해요.
        </p>
      </div>

      <ul className="stack stack--sm">
        {WEEKEND_IDEAS.map((idea) => (
          <li key={idea.kind}>
            <button
              type="button"
              className={`stepper__item ${kind === idea.kind ? 'is-current' : ''}`}
              style={{ width: '100%' }}
              onClick={() => setKind(idea.kind)}
            >
              {idea.kind}
              <span className="stepper__meta">{idea.hint}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="row">
        <label className="tiny" htmlFor="weekend-minutes">
          몇 분 봤나요
        </label>
        <input
          id="weekend-minutes"
          className="input"
          style={{ maxWidth: 110 }}
          type="number"
          min={5}
          max={120}
          step={5}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />
      </div>

      <input
        className="input"
        placeholder="무엇을 봤는지 한 줄 (선택)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <button
        type="button"
        className="btn btn--primary"
        onClick={() => addWeekendLog({ date: today, kind, minutes, note })}
      >
        {saved ? '오늘 기록 고치기' : '오늘 기록하기'}
      </button>

      {data.weekend.length > 0 && (
        <details>
          <summary className="tiny">지난 기록 {data.weekend.length}개</summary>
          <ul className="stack stack--sm" style={{ marginTop: 'var(--sp-2)' }}>
            {[...data.weekend]
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .slice(0, 10)
              .map((w) => (
                <li key={w.date} className="vocab-list__row">
                  <span>
                    {w.date} · {w.kind}
                  </span>
                  <span className="muted">{w.minutes}분</span>
                </li>
              ))}
          </ul>
        </details>
      )}
    </section>
  );
}
