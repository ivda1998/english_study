import { useEffect, useRef, useState } from 'react';
import { formatClock, formatDuration, toISODate } from '@/domain/date';
import { useRecorder } from '@/hooks/useRecorder';
import { addSpeakingEntry } from '@/store/actions';
import { saveClip } from '@/store/recordings';
import type { SpeakingEntry } from '@/store/types';

interface Props {
  dayId: string;
  kind: SpeakingEntry['kind'];
  /** 기록에 남길 주제 */
  topic: string;
  targetSeconds: number;
  onSaved: (seconds: number) => void;
}

type Phase = 'ready' | 'talking' | 'review';

const FEELINGS: { value: SpeakingEntry['feeling']; label: string }[] = [
  { value: 'easy', label: '쉬웠어요' },
  { value: 'ok', label: '할 만했어요' },
  { value: 'hard', label: '어려웠어요' },
];

/**
 * 말하기 녹음 + 시간 재기.
 * 정확도는 재지 않는다. 얼마나 오래 말했는지만 남긴다.
 * 마이크를 못 써도 시간은 그대로 기록되므로 훈련이 끊기지 않는다.
 */
export default function TalkRecorder({ dayId, kind, topic, targetSeconds, onSaved }: Props) {
  const recorder = useRecorder();
  const [phase, setPhase] = useState<Phase>('ready');
  const [seconds, setSeconds] = useState(0);
  const [feeling, setFeeling] = useState<SpeakingEntry['feeling']>('ok');
  const [saving, setSaving] = useState(false);
  const startedAt = useRef(0);

  useEffect(() => {
    if (phase !== 'talking') return;
    startedAt.current = Date.now();
    const id = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [phase]);

  const canRecord = recorder.status !== 'unsupported' && recorder.status !== 'denied';
  const reached = seconds >= targetSeconds;
  const ratio = Math.min(1, targetSeconds > 0 ? seconds / targetSeconds : 0);

  const start = async () => {
    setSeconds(0);
    setPhase('talking');
    if (canRecord) await recorder.start();
  };

  const stop = () => {
    if (recorder.status === 'recording') recorder.stop();
    setPhase('review');
  };

  const save = async () => {
    setSaving(true);
    let recordingId: string | undefined;
    if (recorder.blob) {
      recordingId = `${dayId}-${kind}-${Date.now()}`;
      try {
        await saveClip({
          id: recordingId,
          blob: recorder.blob,
          mimeType: recorder.mimeType || 'audio/webm',
          seconds,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // 저장에 실패해도 말한 기록 자체는 남긴다.
        recordingId = undefined;
      }
    }
    addSpeakingEntry({
      date: toISODate(),
      dayId,
      kind,
      topic,
      seconds,
      feeling,
      recordingId,
    });
    setSaving(false);
    onSaved(seconds);
  };

  if (phase === 'ready') {
    return (
      <div className="mic">
        <p className="tiny">목표 {formatDuration(targetSeconds)}</p>
        <p className="muted" style={{ textAlign: 'center' }}>
          준비되면 시작을 누르고, 키워드만 보면서 말해보세요.
        </p>
        <button type="button" className="btn btn--primary" onClick={start}>
          ● 시작하기
        </button>
        {recorder.status === 'unsupported' && (
          <p className="tiny">이 브라우저는 녹음을 지원하지 않아요. 시간만 재고 기록할게요.</p>
        )}
        {recorder.status === 'denied' && (
          <p className="tiny">마이크 없이 진행해요. 말한 시간은 그대로 기록돼요.</p>
        )}
      </div>
    );
  }

  if (phase === 'talking') {
    return (
      <div className="mic">
        <p className={`mic__time ${reached ? 'is-goal' : ''}`}>{formatClock(seconds)}</p>
        <div className="bar mic__ring">
          <div
            className="bar__fill"
            style={{ width: `${ratio * 100}%`, background: reached ? 'var(--ok)' : 'var(--accent)' }}
          />
        </div>
        <p className="tiny">
          {reached ? `목표 ${formatDuration(targetSeconds)} 넘었어요. 멈춰도 좋아요.` : `목표 ${formatDuration(targetSeconds)}`}
        </p>
        <button type="button" className="btn btn--primary" onClick={stop}>
          ■ 다 말했어요
        </button>
        {recorder.error && <p className="tiny">{recorder.error}</p>}
      </div>
    );
  }

  return (
    <div className="mic">
      <p className={`mic__time ${reached ? 'is-goal' : ''}`}>{formatClock(seconds)}</p>
      <p className="tiny">{reached ? '목표를 넘겼어요' : '괜찮아요. 다음에 조금만 더 해봐요.'}</p>

      {recorder.url && (
        <>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={recorder.url} style={{ width: '100%', maxWidth: 320 }} />
          <p className="tiny">녹음은 이 기기 안에만 저장돼요. 어디로도 전송되지 않아요.</p>
        </>
      )}

      <div className="stack stack--sm" style={{ width: '100%', maxWidth: 360 }}>
        <p className="tiny">오늘 말해보니 어땠어요?</p>
        <div className="feeling">
          {FEELINGS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`feeling__btn ${feeling === f.value ? 'is-active' : ''}`}
              onClick={() => setFeeling(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            recorder.discard();
            setSeconds(0);
            setPhase('ready');
          }}
        >
          다시 하기
        </button>
        <button type="button" className="btn btn--primary" onClick={save} disabled={saving}>
          {saving ? '저장 중…' : '기록 저장'}
        </button>
      </div>
    </div>
  );
}
