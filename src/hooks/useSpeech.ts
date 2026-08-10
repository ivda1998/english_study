import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppData } from '@/store/actions';

/**
 * Web Speech API(TTS) 래퍼.
 * 지원하지 않는 브라우저에서도 화면이 죽지 않도록 supported 플래그를 노출한다.
 */
export interface SpeechController {
  supported: boolean;
  speaking: boolean;
  /** 문장 여러 개를 순서대로 읽는다. onSentence로 현재 문장 인덱스를 알린다. */
  speak: (text: string | string[], options?: SpeakOptions) => void;
  stop: () => void;
  voices: SpeechSynthesisVoice[];
  /** 현재 읽고 있는 문장 인덱스 (없으면 -1) */
  index: number;
}

export interface SpeakOptions {
  /** 기본값은 설정에 저장된 속도 */
  rate?: number;
  /** 문장 사이 쉬는 시간(ms) — 따라 읽기에서 쓴다 */
  gapMs?: number;
  onSentence?: (index: number) => void;
  onEnd?: () => void;
}

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function useSpeech(): SpeechController {
  const { settings } = useAppData();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [index, setIndex] = useState(-1);
  const cancelled = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const supported = useMemo(isSupported, []);

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, [supported]);

  const stop = useCallback(() => {
    cancelled.current = true;
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
    setIndex(-1);
  }, [supported]);

  // 화면을 떠날 때 소리가 계속 나지 않도록 정리한다.
  useEffect(() => stop, [stop]);

  const pickVoice = useCallback((): SpeechSynthesisVoice | undefined => {
    if (voices.length === 0) return undefined;
    if (settings.voiceURI) {
      const saved = voices.find((v) => v.voiceURI === settings.voiceURI);
      if (saved) return saved;
    }
    return (
      voices.find((v) => v.lang === 'en-US' && /google|samantha|natural/i.test(v.name)) ??
      voices.find((v) => v.lang?.startsWith('en-US')) ??
      voices.find((v) => v.lang?.startsWith('en'))
    );
  }, [voices, settings.voiceURI]);

  const speak = useCallback(
    (text: string | string[], options: SpeakOptions = {}) => {
      if (!supported) return;
      const sentences = (Array.isArray(text) ? text : [text]).filter((s) => s.trim());
      if (sentences.length === 0) return;

      window.speechSynthesis.cancel();
      cancelled.current = false;
      setSpeaking(true);

      const voice = pickVoice();
      const rate = options.rate ?? settings.rate;

      const speakAt = (i: number) => {
        if (cancelled.current || i >= sentences.length) {
          setSpeaking(false);
          setIndex(-1);
          if (!cancelled.current) options.onEnd?.();
          return;
        }
        setIndex(i);
        options.onSentence?.(i);

        const utterance = new SpeechSynthesisUtterance(sentences[i]);
        utterance.lang = voice?.lang ?? 'en-US';
        if (voice) utterance.voice = voice;
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.onend = () => {
          if (cancelled.current) return;
          const gap = options.gapMs ?? 0;
          if (gap > 0) {
            timeoutRef.current = window.setTimeout(() => speakAt(i + 1), gap);
          } else {
            speakAt(i + 1);
          }
        };
        utterance.onerror = () => {
          setSpeaking(false);
          setIndex(-1);
        };
        window.speechSynthesis.speak(utterance);
      };

      speakAt(0);
    },
    [supported, pickVoice, settings.rate],
  );

  return { supported, speaking, speak, stop, voices, index };
}
