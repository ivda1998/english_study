import type { AreaId } from '@/content/schema';
import { areaVars } from '@/components/areaStyle';
import { formatClock } from '@/domain/date';
import { AREA_LABEL } from '@/domain/timetable';
import type { TimerState } from '@/hooks/useTimer';

interface Props {
  area: AreaId;
  minutes: number;
  timer: TimerState;
  onSkip: () => void;
}

/**
 * 블록 상단 바.
 * 시간이 지나도 아무것도 막지 않는다 — "조금 더 해도 괜찮아요"만 알려준다.
 */
export default function BlockBar({ area, minutes, timer, onSkip }: Props) {
  return (
    <div className="blockbar" style={areaVars(area)}>
      <span className="blockbar__title">
        <span className="blockbar__dot" />
        {AREA_LABEL[area]}
        <span className="tiny">{minutes}분</span>
      </span>
      <div className="topbar__spacer" />
      <span className={`blockbar__clock ${timer.overtime ? 'is-over' : ''}`}>
        {timer.overtime ? `+${formatClock(timer.elapsed - minutes * 60)}` : formatClock(timer.remaining)}
      </span>
      <button
        type="button"
        className="btn btn--sm btn--ghost"
        onClick={timer.toggle}
        aria-label={timer.running ? '타이머 멈추기' : '타이머 다시 켜기'}
      >
        {timer.running ? '멈춤' : '계속'}
      </button>
      <button type="button" className="btn btn--sm btn--ghost" onClick={onSkip}>
        건너뛰기
      </button>
    </div>
  );
}
