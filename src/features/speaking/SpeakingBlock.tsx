import { useMemo, useState } from 'react';
import { splitSentences } from '@/domain/curriculum';
import { nextTargetSeconds } from '@/domain/goals';
import { hasOneMinuteTalk } from '@/domain/timetable';
import { logSpeakingStages, useAppData } from '@/store/actions';
import type { BlockProps } from '@/features/session/types';
import ShadowingStage from './ShadowingStage';
import SubstitutionStage from './SubstitutionStage';
import QnaStage from './QnaStage';
import TalkRecorder from './TalkRecorder';

type StageId = 'shadow' | 'sub' | 'qna' | 'talk' | 'math' | 'retell';

interface StageDef {
  id: StageId;
  label: string;
  minutes: string;
}

/**
 * 말하기 10~15분.
 * ① 따라 읽기 ② 문장 바꿔 말하기 ③ 질문에 답하기 ④ 1분 말하기(화·목·금)
 * 수학 연결 말하기와 지문 설명하기는 있는 날에만 탭이 열린다.
 */
export default function SpeakingBlock({ day, onDone }: BlockProps) {
  const data = useAppData();
  const { speaking } = day;
  const log = data.stageLogs[day.id];
  const [stage, setStage] = useState<StageId>('shadow');
  const [talkDone, setTalkDone] = useState(false);
  const [mathDone, setMathDone] = useState(false);
  const [retellDone, setRetellDone] = useState(false);

  const target = useMemo(() => nextTargetSeconds(data.speaking), [data.speaking]);
  const showOneMinute = hasOneMinuteTalk(day.dayOfWeek) && Boolean(speaking.oneMinute);

  const stages: StageDef[] = [
    { id: 'shadow', label: '① 따라 읽기', minutes: '3분' },
    { id: 'sub', label: '② 바꿔 말하기', minutes: '3분' },
    { id: 'qna', label: '③ 질문에 답하기', minutes: '3분' },
    ...(showOneMinute ? [{ id: 'talk' as const, label: '④ 1분 말하기', minutes: '3~5분' }] : []),
    ...(speaking.mathTalk ? [{ id: 'math' as const, label: '🧮 수학으로 말하기', minutes: '보너스' }] : []),
    { id: 'retell', label: '📖 지문 설명하기', minutes: '보너스' },
  ];

  const isDone = (id: StageId): boolean => {
    switch (id) {
      case 'shadow':
        return Boolean(log?.shadowingDone);
      case 'sub':
        return (log?.substitutionCount ?? 0) >= 3;
      case 'qna':
        return (log?.qnaCount ?? 0) >= 3;
      case 'talk':
        return talkDone;
      case 'math':
        return mathDone;
      case 'retell':
        return retellDone;
    }
  };

  const coreDone = ['shadow', 'sub', 'qna'].every((id) => isDone(id as StageId));

  const goNext = (from: StageId) => {
    const order = stages.map((s) => s.id);
    const at = order.indexOf(from);
    if (at >= 0 && at + 1 < order.length) setStage(order[at + 1]);
  };

  return (
    <div className="card stack">
      <div className="stack stack--sm">
        <p className="eyebrow">말하기</p>
        <h2 className="section-title">
          {speaking.oneMinute?.topicKo ?? '오늘 읽은 것을 영어로 말해봐요'}
        </h2>
      </div>

      <div className="stage-tabs" role="tablist">
        {stages.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={stage === s.id}
            className={`stage-tab ${stage === s.id ? 'is-active' : ''} ${isDone(s.id) ? 'is-done' : ''}`}
            onClick={() => setStage(s.id)}
          >
            {s.label} <span className="tiny">{s.minutes}</span>
          </button>
        ))}
      </div>

      {stage === 'shadow' && (
        <ShadowingStage
          sentences={speaking.shadowing}
          onDone={() => {
            logSpeakingStages(day.id, { shadowingDone: true });
            goNext('shadow');
          }}
        />
      )}

      {stage === 'sub' && (
        <SubstitutionStage
          substitution={speaking.substitution}
          count={log?.substitutionCount ?? 0}
          onCount={(count) => logSpeakingStages(day.id, { substitutionCount: count })}
          onDone={() => goNext('sub')}
        />
      )}

      {stage === 'qna' && (
        <QnaStage
          qna={speaking.qna}
          count={log?.qnaCount ?? 0}
          onCount={(count) => logSpeakingStages(day.id, { qnaCount: count })}
          onDone={() => goNext('qna')}
        />
      )}

      {stage === 'talk' && speaking.oneMinute && (
        <div className="stack">
          <div className="note note--tip">
            키워드 5개만 보고 말해요. <strong>30초여도 성공</strong>이에요.
          </div>
          <p className="pattern">{speaking.oneMinute.topic}</p>
          <div className="slot-options">
            {speaking.oneMinute.keywords.map((k) => (
              <span key={k} className="slot-option" style={{ cursor: 'default' }}>
                {k}
              </span>
            ))}
          </div>
          {talkDone ? (
            <div className="note note--ok">기록했어요. 오늘 말하기 끝!</div>
          ) : (
            <TalkRecorder
              dayId={day.id}
              kind="oneMinute"
              topic={speaking.oneMinute.topic}
              targetSeconds={target}
              onSaved={() => setTalkDone(true)}
            />
          )}
        </div>
      )}

      {stage === 'math' && speaking.mathTalk && (
        <div className="stack">
          <div className="note note--tip">
            수학 문제 푸는 순서를 영어로 말해봐요. <strong>First / Then / Finally</strong> 세 문장이면 충분해요.
          </div>
          <div className="card card--flat stack stack--sm">
            <p className="en" style={{ fontSize: 18 }}>
              {speaking.mathTalk.problem}
            </p>
            <p className="tiny">{speaking.mathTalk.problemKo}</p>
          </div>
          <div className="stack stack--sm">
            <p className="tiny">이렇게 말해보세요</p>
            {speaking.mathTalk.basic.map((line) => (
              <div key={line} className="speak-line">
                <span className="speak-line__text">{line}</span>
              </div>
            ))}
          </div>
          <details>
            <summary className="tiny">익숙해졌다면 이렇게</summary>
            <div className="stack stack--sm" style={{ marginTop: 'var(--sp-2)' }}>
              {speaking.mathTalk.upgraded.map((line) => (
                <div key={line} className="speak-line">
                  <span className="speak-line__text">{line}</span>
                </div>
              ))}
            </div>
          </details>
          {mathDone ? (
            <div className="note note--ok">기록했어요.</div>
          ) : (
            <TalkRecorder
              dayId={day.id}
              kind="mathTalk"
              topic={speaking.mathTalk.problemKo}
              targetSeconds={30}
              onSaved={() => setMathDone(true)}
            />
          )}
        </div>
      )}

      {stage === 'retell' && (
        <div className="stack">
          <div className="note note--tip">
            겨울방학 목표 연습이에요. 오늘 읽은 지문을 <strong>내 말로</strong> 설명해봐요. 문장 두세 개면 충분해요.
          </div>
          <div className="card card--flat stack stack--sm">
            <p className="eyebrow">{day.reading.passage.topic}</p>
            <strong>{day.reading.passage.title}</strong>
            <ul className="stack stack--sm">
              {splitSentences(day.reading.passage.body)
                .slice(0, 2)
                .map((s) => (
                  <li key={s} className="tiny en">
                    {s}
                  </li>
                ))}
            </ul>
          </div>
          {retellDone ? (
            <div className="note note--ok">기록했어요.</div>
          ) : (
            <TalkRecorder
              dayId={day.id}
              kind="retell"
              topic={day.reading.passage.title}
              targetSeconds={60}
              onSaved={() => setRetellDone(true)}
            />
          )}
        </div>
      )}

      <div className="row row--between">
        <p className="tiny">
          {coreDone ? '①~③ 다 했어요.' : '①~③만 해도 오늘 말하기는 충분해요.'}
        </p>
        <button type="button" className="btn btn--primary" onClick={() => onDone({})}>
          말하기 끝내기
        </button>
      </div>
    </div>
  );
}
