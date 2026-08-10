import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'stopped' | 'denied' | 'unsupported';

export interface RecorderState {
  status: RecorderStatus;
  /** 녹음된 초 */
  seconds: number;
  /** 재생용 URL (녹음이 끝난 뒤 생김) */
  url: string | null;
  blob: Blob | null;
  mimeType: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  discard: () => void;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

/**
 * 마이크 녹음.
 * 녹음 파일은 이 기기 밖으로 나가지 않는다 — 어디에도 업로드하지 않는다.
 * 마이크를 못 쓰는 상황(미지원·권한 거부)에서도 말하기 훈련 자체는 계속할 수 있도록
 * 상태만 알려주고 화면을 막지 않는다.
 */
export function useRecorder(): RecorderState {
  const [status, setStatus] = useState<RecorderStatus>(() =>
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === 'undefined'
      ? 'unsupported'
      : 'idle',
  );
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mimeType = useRef<string>('');

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const startedAt = useRef(0);
  const tick = useRef<number | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanupStream = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (tick.current) {
      window.clearInterval(tick.current);
      tick.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      cleanupStream();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [cleanupStream],
  );

  const discard = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setUrl(null);
    setBlob(null);
    setSeconds(0);
    setStatus((s) => (s === 'stopped' ? 'idle' : s));
  }, []);

  const start = useCallback(async () => {
    if (status === 'unsupported') return;
    setError(null);
    discard();
    setStatus('requesting');
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      mimeType.current = pickMimeType();
      const rec = new MediaRecorder(media, mimeType.current ? { mimeType: mimeType.current } : undefined);
      chunks.current = [];
      rec.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      rec.onstop = () => {
        const type = mimeType.current || 'audio/webm';
        const result = new Blob(chunks.current, { type });
        const objectUrl = URL.createObjectURL(result);
        urlRef.current = objectUrl;
        setBlob(result);
        setUrl(objectUrl);
        setStatus('stopped');
        cleanupStream();
      };
      recorder.current = rec;
      startedAt.current = Date.now();
      setSeconds(0);
      rec.start();
      setStatus('recording');
      tick.current = window.setInterval(() => {
        setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
      }, 250);
    } catch (e) {
      cleanupStream();
      const name = e instanceof DOMException ? e.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setStatus('denied');
        setError('마이크 사용이 허용되지 않았어요. 녹음 없이도 말하기 연습은 그대로 할 수 있어요.');
      } else {
        setStatus('idle');
        setError('마이크를 열지 못했어요. 녹음 없이 진행해도 괜찮아요.');
      }
    }
  }, [status, discard, cleanupStream]);

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== 'inactive') {
      setSeconds(Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)));
      recorder.current.stop();
    }
  }, []);

  return {
    status,
    seconds,
    url,
    blob,
    mimeType: mimeType.current,
    error,
    start,
    stop,
    discard,
  };
}
