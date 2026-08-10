import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { AreaId } from '@/content/schema';
import { areaVars } from '@/components/areaStyle';
import { findDay, findWeekOf, nextDay } from '@/domain/curriculum';
import { formatDuration } from '@/domain/date';
import { AREA_DESCRIPTION, AREA_LABEL, AREA_ORDER, TIMETABLE, WEEKDAY_LABEL } from '@/domain/timetable';
import { useCurriculum } from '@/hooks/useCurriculum';
import { useTimer } from '@/hooks/useTimer';
import { addBlockSeconds, completeBlock, recordWrongAnswers, startBlock, useAppData } from '@/store/actions';
import BlockBar from '@/features/session/BlockBar';
import VocabBlock from '@/features/session/VocabBlock';
import GrammarBlock from '@/features/session/GrammarBlock';
import ReadingBlock from '@/features/session/ReadingBlock';
import ListeningBlock from '@/features/session/ListeningBlock';
import SpeakingBlock from '@/features/speaking/SpeakingBlock';
import type { BlockResult } from '@/features/session/types';

export default function SessionPage() {
  const { dayId = '' } = useParams();
  const weeks = useCurriculum();
  const data = useAppData();
  const day = useMemo(() => findDay(weeks, dayId), [weeks, dayId]);
  const week = useMemo(() => findWeekOf(weeks, dayId), [weeks, dayId]);
  const progress = data.days[dayId];

  const firstUnfinished =
    AREA_ORDER.find((area) => progress?.blocks[area]?.status !== 'done') ?? 'vocab';
  const [area, setArea] = useState<AreaId>(firstUnfinished);
  const [finished, setFinished] = useState(false);

  const minutes = day ? TIMETABLE[day.dayOfWeek][area] : 15;
  const timer = useTimer({ minutes });

  // 블록을 바꾸거나 화면을 떠날 때 머문 시간을 기록한다.
  const elapsedRef = useRef(0);
  elapsedRef.current = timer.elapsed;
  useEffect(() => {
    const currentArea = area;
    startBlock(dayId, currentArea);
    return () => {
      addBlockSeconds(dayId, currentArea, elapsedRef.current);
    };
  }, [dayId, area]);

  if (!day || !week) {
    return (
      <div className="stack">
        <h1 className="page-title">학습을 찾을 수 없어요</h1>
        <Link className="btn btn--primary" to="/">
          오늘 학습으로
        </Link>
      </div>
    );
  }

  const handleDone = (result: BlockResult) => {
    completeBlock(dayId, area, { seconds: timer.elapsed, score: result.score });
    if (result.wrong?.length) {
      recordWrongAnswers(dayId, area, result.wrong);
    }
    const at = AREA_ORDER.indexOf(area);
    if (at + 1 < AREA_ORDER.length) {
      setArea(AREA_ORDER[at + 1]);
      timer.reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    const totalSeconds = AREA_ORDER.reduce(
      (sum, a) => sum + (data.days[dayId]?.blocks[a]?.seconds ?? 0),
      0,
    );
    const upcoming = nextDay(weeks, data.days);
    return (
      <div className="stack stack--lg">
        <div className="card stack">
          <p className="eyebrow">오늘 학습 완료</p>
          <h1 className="page-title">{day.title} — 끝!</h1>
          <p className="muted">오늘 {formatDuration(totalSeconds)} 공부했어요.</p>
          <ul className="grid grid--areas">
            {AREA_ORDER.map((a) => {
              const block = data.days[dayId]?.blocks[a];
              return (
                <li key={a} className="stat" style={{ ...areaVars(a), padding: 'var(--sp-3)' }}>
                  <span className="stat__value" style={{ fontSize: 16, color: 'var(--area-color)' }}>
                    {AREA_LABEL[a]}
                  </span>
                  <span className="stat__label">
                    {block?.score ? `${block.score.correct}/${block.score.total}` : '완료'}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="row">
            <Link className="btn btn--primary" to="/">
              오늘 화면으로
            </Link>
            {upcoming && upcoming.id !== dayId && (
              <Link className="btn btn--ghost" to={`/day/${upcoming.id}`}>
                다음 날 미리 하기
              </Link>
            )}
            <Link className="btn btn--ghost" to="/review">
              복습하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="stack stack--sm">
        <p className="eyebrow">
          {week.week}주차 · {WEEKDAY_LABEL[day.dayOfWeek]}요일 · {day.title}
        </p>
        <div className="stepper" role="tablist" aria-label="학습 블록">
          {AREA_ORDER.map((a) => {
            const done = data.days[dayId]?.blocks[a]?.status === 'done';
            return (
              <button
                key={a}
                type="button"
                role="tab"
                aria-selected={a === area}
                style={areaVars(a)}
                className={`stepper__item ${a === area ? 'is-current' : ''} ${done ? 'is-done' : ''}`}
                onClick={() => setArea(a)}
              >
                {AREA_LABEL[a]} {done ? '✓' : ''}
                <span className="stepper__meta">{TIMETABLE[day.dayOfWeek][a]}분</span>
              </button>
            );
          })}
        </div>
      </div>

      <BlockBar
        area={area}
        minutes={minutes}
        timer={timer}
        onSkip={() => {
          const at = AREA_ORDER.indexOf(area);
          if (at + 1 < AREA_ORDER.length) setArea(AREA_ORDER[at + 1]);
          else setFinished(true);
        }}
      />

      <p className="tiny">{AREA_DESCRIPTION[area]}</p>

      {area === 'vocab' && <VocabBlock key={`${dayId}-vocab`} day={day} onDone={handleDone} />}
      {area === 'grammar' && <GrammarBlock key={`${dayId}-grammar`} day={day} onDone={handleDone} />}
      {area === 'reading' && <ReadingBlock key={`${dayId}-reading`} day={day} onDone={handleDone} />}
      {area === 'listening' && <ListeningBlock key={`${dayId}-listening`} day={day} onDone={handleDone} />}
      {area === 'speaking' && <SpeakingBlock key={`${dayId}-speaking`} day={day} onDone={handleDone} />}
    </div>
  );
}
