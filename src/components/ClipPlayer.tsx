import { useEffect, useState } from 'react';
import { loadClip } from '@/store/recordings';

/** 저장된 녹음을 필요할 때만 IndexedDB에서 꺼내 재생한다. */
export default function ClipPlayer({ recordingId }: { recordingId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    loadClip(recordingId)
      .then((clip) => {
        if (cancelled || !clip) {
          if (!cancelled) setError(true);
          return;
        }
        objectUrl = URL.createObjectURL(clip.blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [recordingId]);

  if (error) return <span className="tiny">녹음을 찾을 수 없어요</span>;
  if (!url) return <span className="tiny">불러오는 중…</span>;
  // eslint-disable-next-line jsx-a11y/media-has-caption
  return <audio controls src={url} style={{ width: '100%', maxWidth: 280 }} />;
}
