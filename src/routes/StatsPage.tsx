import { useMemo } from 'react';
import ClipPlayer from '@/components/ClipPlayer';
import { completedDayCount, overallPercent } from '@/domain/curriculum';
import { formatDuration, formatKoreanDate } from '@/domain/date';
import { computeMilestones, nextTargetSeconds } from '@/domain/goals';
import { boxDistribution, masteredCount } from '@/domain/srs';
import { AREA_LABEL, AREA_ORDER } from '@/domain/timetable';
import { useCurriculum } from '@/hooks/useCurriculum';
import { removeSpeakingEntry, useAppData } from '@/store/actions';

const FEELING_LABEL = { easy: '쉬웠어요', ok: '할 만했어요', hard: '어려웠어요' } as const;
const KIND_LABEL = { oneMinute: '1분 말하기', mathTalk: '수학으로 말하기', retell: '지문 설명하기' } as const;

export default function StatsPage() {
  const weeks = useCurriculum();
  const data = useAppData();
  const milestones = computeMilestones(data.speaking);
  const cards = Object.values(data.srs);

  const talks = useMemo(
    () => [...data.speaking].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [data.speaking],
  );
  const recent = useMemo(() => [...data.speaking].reverse().slice(0, 12), [data.speaking]);
  const maxSeconds = Math.max(90, ...talks.map((t) => t.seconds));

  const areaSeconds = useMemo(() => {
    const totals = Object.fromEntries(AREA_ORDER.map((a) => [a, 0])) as Record<string, number>;
    for (const day of Object.values(data.days)) {
      for (const area of AREA_ORDER) {
        totals[area] += day.blocks[area]?.seconds ?? 0;
      }
    }
    return totals;
  }, [data.days]);

  const totalSeconds = Object.values(areaSeconds).reduce((a, b) => a + b, 0);

  return (
    <div className="stack stack--lg">
      <div className="stack stack--sm">
        <h1 className="page-title">성장 기록</h1>
        <p className="muted">점수가 아니라 얼마나 자주, 얼마나 오래 말했는지를 봐요.</p>
      </div>

      <section className="grid grid--3">
        <div className="stat">
          <span className="stat__value">{completedDayCount(weeks, data.days)}일</span>
          <span className="stat__label">완주한 날</span>
        </div>
        <div className="stat">
          <span className="stat__value">{overallPercent(weeks, data.days)}%</span>
          <span className="stat__label">전체 진도</span>
        </div>
        <div className="stat">
          <span className="stat__value">{formatDuration(totalSeconds)}</span>
          <span className="stat__label">누적 공부 시간</span>
        </div>
        <div className="stat">
          <span className="stat__value">{data.speaking.length}회</span>
          <span className="stat__label">말하기 기록</span>
        </div>
        <div className="stat">
          <span className="stat__value">{masteredCount(cards)}개</span>
          <span className="stat__label">외운 단어</span>
        </div>
        <div className="stat">
          <span className="stat__value">{formatDuration(nextTargetSeconds(data.speaking))}</span>
          <span className="stat__label">다음 말하기 목표</span>
        </div>
      </section>

      <section className="card stack">
        <h2 className="section-title">목표까지</h2>
        <ul className="stack stack--sm">
          {milestones.map((m) => (
            <li key={m.id} className={`goal ${m.done ? 'is-done' : ''}`}>
              <div className="row row--between">
                <strong>
                  <span className="chip">{m.when}</span> {m.title}
                </strong>
                <span className="tiny">{m.percent}%</span>
              </div>
              <div className="bar">
                <div className="bar__fill" style={{ width: `${m.percent}%` }} />
              </div>
              <p className="tiny">{m.status}</p>
              <p className="tiny">{m.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card stack">
        <h2 className="section-title">말하기 시간 변화</h2>
        {talks.length === 0 ? (
          <p className="muted">아직 기록이 없어요. 1분 말하기를 한 번 해보면 여기에 쌓여요.</p>
        ) : (
          <>
            <div className="spark">
              {talks.slice(-30).map((t) => (
                <div
                  key={t.id}
                  className="spark__bar"
                  style={{ height: `${Math.max(6, (t.seconds / maxSeconds) * 100)}%` }}
                  title={`${t.date} · ${formatDuration(t.seconds)}`}
                />
              ))}
            </div>
            <p className="tiny">가장 최근 30회. 막대가 조금씩 높아지면 잘 되고 있는 거예요.</p>
          </>
        )}
      </section>

      <section className="card stack">
        <h2 className="section-title">영역별 공부 시간</h2>
        <ul className="stack stack--sm">
          {AREA_ORDER.map((area) => {
            const seconds = areaSeconds[area];
            const percent = totalSeconds === 0 ? 0 : (seconds / totalSeconds) * 100;
            return (
              <li key={area} className="stack stack--sm">
                <div className="row row--between">
                  <span>{AREA_LABEL[area]}</span>
                  <span className="tiny">{formatDuration(seconds)}</span>
                </div>
                <div className="bar">
                  <div
                    className="bar__fill"
                    style={{ width: `${percent}%`, background: `var(--area-${area})` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card stack">
        <h2 className="section-title">단어 기억 상태</h2>
        <div className="spark">
          {boxDistribution(cards).map((n, i) => (
            <div
              key={i}
              className={`spark__bar ${n === 0 ? 'is-empty' : ''}`}
              style={{ height: `${Math.max(6, (n / Math.max(1, ...boxDistribution(cards))) * 100)}%` }}
              title={`${i + 1}번 상자: ${n}개`}
            />
          ))}
        </div>
        <p className="tiny">
          오른쪽 상자로 갈수록 오래 기억한 단어예요. 총 {cards.length}개 중 {masteredCount(cards)}개가
          마지막 상자에 있어요.
        </p>
      </section>

      {recent.length > 0 && (
        <section className="card stack">
          <h2 className="section-title">최근 말하기</h2>
          <ul className="stack">
            {recent.map((entry) => (
              <li key={entry.id} className="stack stack--sm" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-3)' }}>
                <div className="row row--between">
                  <strong>{entry.topic}</strong>
                  <span className="tiny">{formatDuration(entry.seconds)}</span>
                </div>
                <p className="tiny">
                  {formatKoreanDate(entry.date)} · {KIND_LABEL[entry.kind]} ·{' '}
                  {FEELING_LABEL[entry.feeling]}
                </p>
                {entry.recordingId && <ClipPlayer recordingId={entry.recordingId} />}
                <div>
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() => removeSpeakingEntry(entry.id)}
                  >
                    기록 지우기
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
