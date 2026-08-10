import { useMemo } from 'react';
import ClipPlayer from '@/components/ClipPlayer';
import { findDay, nextDay } from '@/domain/curriculum';
import { formatDuration, formatKoreanDate, lastNDays, toISODate } from '@/domain/date';
import { computeMilestones } from '@/domain/goals';
import { AREA_LABEL, AREA_ORDER } from '@/domain/timetable';
import { useCurriculum } from '@/hooks/useCurriculum';
import { useAppData } from '@/store/actions';

const COACHING = [
  {
    title: '문법을 바로 고치지 마세요',
    body: '아이가 "I like math because... um... it\'s..." 라고 말했을 때 "그거 문법 틀렸어" 대신 "아, 수학이 좋아서 그렇구나" 하고 내용에 반응해 주세요.',
  },
  {
    title: '끝까지 말한 뒤, 딱 하나만',
    body: '말이 끝난 다음에 고칠 게 여러 개 보여도 하나만 골라 알려주세요. 말하기를 싫어하는 아이에게는 정확성보다 말한 경험을 좋게 만드는 것이 먼저예요.',
  },
  {
    title: '길게 말하라고 하지 않기',
    body: '질문에 한 문장으로 답해도 성공이에요. "더 말해봐"는 다음 번에 입을 닫게 만들어요.',
  },
  {
    title: '발음은 건드리지 않기',
    body: '따라 읽기 단계의 목표는 정확한 발음이 아니라 영어를 입 밖으로 꺼내는 것입니다.',
  },
  {
    title: '주말은 쉬게 두기',
    body: '토요일에는 좋아하는 영어 영상이나 책 20~30분이면 충분해요. "공부해야 한다"는 느낌을 줄이는 게 중요합니다.',
  },
];

export default function ParentPage() {
  const weeks = useCurriculum();
  const data = useAppData();
  const today = toISODate();
  const days7 = lastNDays(7, today);
  const target = nextDay(weeks, data.days);
  const todayDay = target ? findDay(weeks, target.id) : undefined;

  const weekStats = useMemo(() => {
    const inRange = new Set(days7);
    let seconds = 0;
    let doneDays = 0;
    const byArea = Object.fromEntries(AREA_ORDER.map((a) => [a, 0])) as Record<string, number>;

    for (const day of Object.values(data.days)) {
      const dayDate = day.completedAt ? day.completedAt.slice(0, 10) : day.startedOn;
      if (!inRange.has(dayDate)) continue;
      if (day.completedAt) doneDays += 1;
      for (const area of AREA_ORDER) {
        const s = day.blocks[area]?.seconds ?? 0;
        byArea[area] += s;
        seconds += s;
      }
    }

    const talks = data.speaking.filter((e) => inRange.has(e.date));
    const avg = talks.length === 0 ? 0 : talks.reduce((s, t) => s + t.seconds, 0) / talks.length;
    return { seconds, doneDays, byArea, talkCount: talks.length, talkAvg: avg };
  }, [data.days, data.speaking, days7]);

  const studiedDates = useMemo(() => {
    const set = new Set<string>();
    for (const day of Object.values(data.days)) {
      if (day.completedAt) set.add(day.completedAt.slice(0, 10));
      else set.add(day.startedOn);
    }
    return set;
  }, [data.days]);

  const milestones = computeMilestones(data.speaking);
  const recentTalks = [...data.speaking].reverse().slice(0, 5);

  return (
    <div className="stack stack--lg">
      <div className="stack stack--sm">
        <h1 className="page-title">부모 화면</h1>
        <p className="muted">
          점수를 보는 곳이 아니라, 아이가 얼마나 꾸준히 하고 있는지 보는 곳이에요.
        </p>
      </div>

      <section className="card stack">
        <h2 className="section-title">이번 주 (최근 7일)</h2>
        <div className="grid grid--3">
          <div className="stat">
            <span className="stat__value">{weekStats.doneDays}일</span>
            <span className="stat__label">완주한 날</span>
          </div>
          <div className="stat">
            <span className="stat__value">{formatDuration(weekStats.seconds)}</span>
            <span className="stat__label">공부한 시간</span>
          </div>
          <div className="stat">
            <span className="stat__value">{weekStats.talkCount}회</span>
            <span className="stat__label">말하기 기록</span>
          </div>
        </div>

        <div className="row" style={{ gap: 6 }}>
          {days7.map((date) => (
            <div key={date} className="stack stack--sm" style={{ alignItems: 'center', flex: 1 }}>
              <div
                className={`dots__dot ${studiedDates.has(date) ? 'is-done' : ''}`}
                style={{ width: 22, height: 22 }}
                title={date}
              />
              <span className="tiny">{date.slice(5).replace('-', '/')}</span>
            </div>
          ))}
        </div>

        {weekStats.talkCount > 0 && (
          <p className="tiny">
            이번 주 말하기 평균 {formatDuration(weekStats.talkAvg)} — 시간이 조금씩 늘고 있으면 잘 되고
            있는 거예요.
          </p>
        )}

        <ul className="stack stack--sm">
          {AREA_ORDER.map((area) => {
            const seconds = weekStats.byArea[area];
            const percent = weekStats.seconds === 0 ? 0 : (seconds / weekStats.seconds) * 100;
            return (
              <li key={area} className="stack stack--sm">
                <div className="row row--between">
                  <span className="tiny">{AREA_LABEL[area]}</span>
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
        <h2 className="section-title">도와줄 때 가장 중요한 것</h2>
        <ul className="stack stack--sm">
          {COACHING.map((tip) => (
            <li key={tip.title} className="note note--tip">
              <strong>{tip.title}</strong>
              <p style={{ marginTop: 4 }}>{tip.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {todayDay && (
        <section className="card stack">
          <h2 className="section-title">오늘 물어볼 질문</h2>
          <p className="tiny">
            그대로 읽어주시면 돼요. 한 문장으로 대답해도 성공입니다. 대답이 막히면 그냥 넘어가세요.
          </p>
          <ul className="stack stack--sm">
            {todayDay.speaking.qna.map((item) => (
              <li key={item.question} className="speak-line">
                <span className="speak-line__text">{item.question}</span>
              </li>
            ))}
          </ul>
          <details>
            <summary className="tiny">아이가 막힐 때 보여줄 예시 답</summary>
            <ul className="stack stack--sm" style={{ marginTop: 'var(--sp-2)' }}>
              {todayDay.speaking.qna.map((item) => (
                <li key={item.question} className="tiny en">
                  {item.sample}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}

      <section className="card stack">
        <h2 className="section-title">어디로 가고 있나요</h2>
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
            </li>
          ))}
        </ul>
        <p className="tiny">
          수학을 좋아하고 국어를 잘하는 아이라면, 회화보다 <strong>논리적으로 읽고 → 생각하고 → 영어로
          표현하는</strong> 방향이 고등학교에서 강점이 됩니다. 이 계획은 그쪽으로 설계돼 있어요.
        </p>
      </section>

      {recentTalks.length > 0 && (
        <section className="card stack">
          <h2 className="section-title">아이가 말한 것 들어보기</h2>
          <p className="tiny">
            녹음은 이 기기에만 저장돼요. 들으신 뒤에는 잘한 점 하나만 말해주세요.
          </p>
          <ul className="stack">
            {recentTalks.map((entry) => (
              <li key={entry.id} className="stack stack--sm">
                <div className="row row--between">
                  <strong>{entry.topic}</strong>
                  <span className="tiny">{formatDuration(entry.seconds)}</span>
                </div>
                <p className="tiny">{formatKoreanDate(entry.date)}</p>
                {entry.recordingId ? (
                  <ClipPlayer recordingId={entry.recordingId} />
                ) : (
                  <span className="tiny">녹음 없이 시간만 기록했어요</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
