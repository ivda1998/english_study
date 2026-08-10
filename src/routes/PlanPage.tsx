import { Link } from 'react-router-dom';
import { WEEK_TOPIC_LABEL } from '@/content/topics';
import { completedBlockCount, isDayComplete, nextDay } from '@/domain/curriculum';
import {
  AREA_LABEL,
  AREA_ORDER,
  TIMETABLE,
  WEEKDAYS,
  WEEKDAY_LABEL,
  dayTotalMinutes,
} from '@/domain/timetable';
import { useCurriculum } from '@/hooks/useCurriculum';
import { useAppData } from '@/store/actions';

export default function PlanPage() {
  const weeks = useCurriculum();
  const data = useAppData();
  const current = nextDay(weeks, data.days);

  return (
    <div className="stack stack--lg">
      <div className="stack stack--sm">
        <h1 className="page-title">6주 계획</h1>
        <p className="muted">
          주 5일, 하루 60~70분. 주말은 복습과 재미있는 영어로 쉬어요. 하루를 빠져도 밀리지 않아요 —
          아직 끝내지 않은 날부터 이어서 하면 돼요.
        </p>
      </div>

      <section className="card stack">
        <h2 className="section-title">요일별 시간표</h2>
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>요일</th>
                {AREA_ORDER.map((a) => (
                  <th key={a}>{AREA_LABEL[a]}</th>
                ))}
                <th>합계</th>
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((d) => (
                <tr key={d} className={current?.dayOfWeek === d ? 'is-today' : undefined}>
                  <td>
                    <strong>{WEEKDAY_LABEL[d]}</strong>
                  </td>
                  {AREA_ORDER.map((a) => (
                    <td key={a}>{TIMETABLE[d][a]}분</td>
                  ))}
                  <td>
                    <strong>{dayTotalMinutes(d)}분</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tiny">
          말하기가 15분인 화·목·금에만 ④ 1분 말하기가 열려요 (주 3회). 월·수는 ①~③까지만 해요.
        </p>
      </section>

      {weeks.map((week) => {
        const label = WEEK_TOPIC_LABEL[week.week - 1];
        return (
          <section key={week.week} className="card stack">
            <div className="row row--between">
              <div className="stack stack--sm">
                <p className="eyebrow">
                  {week.week}주차 {label ? `· ${label}` : ''}
                </p>
                <h2 className="section-title">{week.title}</h2>
                <p className="tiny">{week.focus}</p>
              </div>
            </div>

            <div className="grid grid--2">
              {week.days.map((day) => {
                const done = isDayComplete(data.days[day.id]);
                const count = completedBlockCount(data.days[day.id]);
                return (
                  <Link
                    key={day.id}
                    to={`/day/${day.id}`}
                    className={`day-card ${done ? 'is-done' : ''} ${current?.id === day.id ? 'is-current' : ''}`}
                  >
                    <div className="row row--between">
                      <strong>
                        {WEEKDAY_LABEL[day.dayOfWeek]}요일 · {day.title}
                      </strong>
                      <span className="tiny">{done ? '완료' : `${count}/5`}</span>
                    </div>
                    <p className="tiny">{day.grammar.point} · {day.reading.passage.title}</p>
                    <div className="dots">
                      {AREA_ORDER.map((a) => (
                        <span
                          key={a}
                          className={`dots__dot ${data.days[day.id]?.blocks[a]?.status === 'done' ? 'is-done' : ''}`}
                        />
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>

            <details>
              <summary className="tiny">이 주의 말하기 주제 5개</summary>
              <ul className="stack stack--sm" style={{ marginTop: 'var(--sp-2)' }}>
                {week.speakingTopics.map((topic) => (
                  <li key={topic} className="speak-line">
                    <span className="speak-line__text">{topic}</span>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        );
      })}

      {weeks.length === 0 && (
        <div className="note">아직 커리큘럼이 없어요. 설정에서 주차 콘텐츠를 넣어보세요.</div>
      )}
    </div>
  );
}
