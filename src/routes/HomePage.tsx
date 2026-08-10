import { Link } from 'react-router-dom';
import { areaVars } from '@/components/areaStyle';
import { useCurriculum } from '@/hooks/useCurriculum';
import { completedBlockCount, completedDayCount, findWeekOf, nextDay, overallPercent } from '@/domain/curriculum';
import { formatKoreanDate, toISODate } from '@/domain/date';
import { computeMilestones } from '@/domain/goals';
import { dueCards } from '@/domain/srs';
import {
  AREA_LABEL,
  AREA_ORDER,
  TIMETABLE,
  WEEKDAY_LABEL,
  dayTotalMinutes,
  weekdayFromDate,
} from '@/domain/timetable';
import { useAppData } from '@/store/actions';

export default function HomePage() {
  const weeks = useCurriculum();
  const data = useAppData();
  const today = toISODate();
  const todayWeekday = weekdayFromDate(new Date());
  const target = nextDay(weeks, data.days);
  const week = target ? findWeekOf(weeks, target.id) : undefined;
  const progress = target ? data.days[target.id] : undefined;
  const doneBlocks = completedBlockCount(progress);
  const due = dueCards(Object.values(data.srs), today);
  const milestones = computeMilestones(data.speaking);
  const percent = overallPercent(weeks, data.days);
  const doneDays = completedDayCount(weeks, data.days);

  if (!target || !week) {
    return (
      <div className="stack">
        <h1 className="page-title">아직 학습 내용이 없어요</h1>
        <p className="muted">
          설정 화면에서 주차 콘텐츠를 넣거나, 커리큘럼 파일을 추가하면 여기에 오늘 학습이 나타나요.
        </p>
        <div>
          <Link className="btn btn--primary" to="/settings">
            설정으로 가기
          </Link>
        </div>
      </div>
    );
  }

  const isWeekend = todayWeekday === null;
  const scheduleDay = target.dayOfWeek;

  return (
    <div className="stack stack--lg">
      <div className="stack stack--sm">
        <p className="eyebrow">{formatKoreanDate(today)}</p>
        <h1 className="page-title">
          {data.profile.name ? `${data.profile.name}, ` : ''}
          {isWeekend ? '오늘은 쉬어도 되는 날이에요' : '오늘도 60분만 해요'}
        </h1>
      </div>

      {isWeekend && (
        <div className="note note--tip">
          주말이에요. 공부 대신 <Link to="/review">좋아하는 영어 영상이나 책</Link>을 20~30분 즐기면 충분해요.
          그래도 하고 싶으면 아래에서 이어서 해도 돼요.
        </div>
      )}

      <section className="card stack">
        <div className="row row--between">
          <div className="stack stack--sm">
            <p className="eyebrow">
              {week.week}주차 · {WEEKDAY_LABEL[scheduleDay]}요일 코스 · 총 {dayTotalMinutes(scheduleDay)}분
            </p>
            <h2 className="section-title">{target.title}</h2>
            <p className="tiny">{week.focus}</p>
          </div>
          <div className="dots" aria-label={`5개 중 ${doneBlocks}개 완료`}>
            {AREA_ORDER.map((area) => (
              <span
                key={area}
                className={`dots__dot ${progress?.blocks[area]?.status === 'done' ? 'is-done' : ''}`}
              />
            ))}
          </div>
        </div>

        <ul className="grid grid--areas">
          {AREA_ORDER.map((area) => {
            const done = progress?.blocks[area]?.status === 'done';
            return (
              <li key={area} className="stat" style={{ ...areaVars(area), padding: 'var(--sp-3)' }}>
                <span className="stat__value" style={{ fontSize: 16, color: 'var(--area-color)' }}>
                  {AREA_LABEL[area]}
                </span>
                <span className="stat__label">
                  {TIMETABLE[scheduleDay][area]}분{done ? ' · 완료' : ''}
                </span>
              </li>
            );
          })}
        </ul>

        <Link className="btn btn--primary btn--block" to={`/day/${target.id}`}>
          {doneBlocks === 0 ? '오늘 학습 시작하기' : `이어서 하기 (${doneBlocks}/5)`}
        </Link>
      </section>

      <section className="grid grid--2">
        <div className="card stack stack--sm">
          <p className="eyebrow">복습할 단어</p>
          <p className="stat__value">{due.length}개</p>
          <p className="tiny">
            {due.length === 0
              ? '오늘 복습할 단어는 없어요.'
              : '오래 기억하려면 잠깐이라도 다시 보는 게 좋아요.'}
          </p>
          <Link className="btn btn--sm btn--ghost" to="/review">
            복습하러 가기
          </Link>
        </div>

        <div className="card stack stack--sm">
          <p className="eyebrow">지금까지</p>
          <p className="stat__value">{doneDays}일 완주</p>
          <div className="bar">
            <div className="bar__fill" style={{ width: `${percent}%` }} />
          </div>
          <p className="tiny">전체 진도 {percent}%</p>
        </div>
      </section>

      <section className="card stack">
        <div className="row row--between">
          <h2 className="section-title">목표</h2>
          <Link className="tiny" to="/stats">
            자세히 보기
          </Link>
        </div>
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
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
