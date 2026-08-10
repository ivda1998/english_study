import { useCallback, useEffect, useRef, useState } from 'react';

interface TimerOptions {
  /** 배정 시간(분) */
  minutes: number;
  /** 시작하자마자 흐르게 할지 */
  autoStart?: boolean;
}

export interface TimerState {
  /** 흐른 시간(초) */
  elapsed: number;
  /** 남은 시간(초). 배정 시간을 넘기면 0 */
  remaining: number;
  running: boolean;
  /** 배정 시간을 넘겼는지 — 알림일 뿐, 막지 않는다 */
  overtime: boolean;
  toggle: () => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

/**
 * 블록 타이머.
 * 시간이 다 되어도 아무것도 막지 않는다. 남은 시간을 보여주는 안내일 뿐이다.
 */
export function useTimer({ minutes, autoStart = true }: TimerOptions): TimerState {
  const total = Math.max(0, Math.round(minutes * 60));
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(autoStart);
  const lastTick = useRef<number>(Date.now());

  useEffect(() => {
    if (!running) return;
    lastTick.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTick.current) / 1000;
      lastTick.current = now;
      // 탭이 백그라운드로 갔다 온 경우 큰 점프가 생기므로 상한을 둔다.
      setElapsed((prev) => prev + Math.min(delta, 5));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // 탭을 벗어나면 타이머를 멈춰 실제 공부한 시간만 센다.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setRunning(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const toggle = useCallback(() => setRunning((r) => !r), []);
  const reset = useCallback(() => setElapsed(0), []);

  const rounded = Math.floor(elapsed);
  return {
    elapsed: rounded,
    remaining: Math.max(0, total - rounded),
    running,
    overtime: rounded > total,
    toggle,
    start,
    pause,
    reset,
  };
}
