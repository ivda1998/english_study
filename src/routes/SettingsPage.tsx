import { useEffect, useState } from 'react';
import { validateWeek, type Week } from '@/content/schema';
import { toISODate } from '@/domain/date';
import { parseVocabPaste } from '@/domain/importVocab';
import { useSpeech } from '@/hooks/useSpeech';
import {
  registerCustomVocab,
  removeCustomVocab,
  removeCustomWeek,
  setProfile,
  setSettings,
  upsertCustomWeek,
  useAppData,
} from '@/store/actions';
import { clearClips, totalClipBytes } from '@/store/recordings';
import { createEmptyData, getData, reconcile, replaceData } from '@/store/storage';

export default function SettingsPage() {
  const data = useAppData();
  const speech = useSpeech();

  return (
    <div className="stack stack--lg">
      <div className="stack stack--sm">
        <h1 className="page-title">설정</h1>
        <p className="muted">
          모든 기록은 이 기기 안에만 저장돼요. 서버로 보내지 않기 때문에 기기를 바꾸려면 아래에서 내보내기를
          해두세요.
        </p>
      </div>

      <section className="card stack">
        <h2 className="section-title">학습자</h2>
        <div className="field">
          <label htmlFor="name">이름 (빈칸으로 둬도 돼요)</label>
          <input
            id="name"
            className="input"
            value={data.profile.name}
            placeholder="예: 지호"
            onChange={(e) => setProfile({ name: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="start">시작한 날</label>
          <input
            id="start"
            className="input"
            type="date"
            value={data.profile.startDate}
            onChange={(e) => setProfile({ startDate: e.target.value || toISODate() })}
          />
        </div>
      </section>

      <section className="card stack">
        <h2 className="section-title">소리와 화면</h2>
        {!speech.supported && (
          <div className="note note--warn">
            이 브라우저는 음성 읽기를 지원하지 않아요. Chrome이나 Safari에서 열면 들을 수 있어요.
          </div>
        )}
        <div className="field">
          <label htmlFor="rate">읽기 속도 — {data.settings.rate.toFixed(2)}배</label>
          <input
            id="rate"
            type="range"
            min={0.5}
            max={1.2}
            step={0.05}
            value={data.settings.rate}
            onChange={(e) => setSettings({ rate: Number(e.target.value) })}
          />
          <p className="tiny">따라 읽기에는 0.8배 정도가 편해요.</p>
        </div>

        {speech.voices.length > 0 && (
          <div className="field">
            <label htmlFor="voice">목소리</label>
            <select
              id="voice"
              className="select"
              value={data.settings.voiceURI ?? ''}
              onChange={(e) => setSettings({ voiceURI: e.target.value || null })}
            >
              <option value="">자동으로 고르기</option>
              {speech.voices
                .filter((v) => v.lang?.startsWith('en'))
                .map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
            </select>
          </div>
        )}

        <button
          type="button"
          className="btn btn--ghost"
          disabled={!speech.supported}
          onClick={() => speech.speak('I like math because it is interesting.')}
        >
          🔊 이렇게 들려요
        </button>

        <div className="field">
          <label htmlFor="theme">화면 밝기</label>
          <select
            id="theme"
            className="select"
            value={data.settings.theme}
            onChange={(e) => setSettings({ theme: e.target.value as 'system' | 'light' | 'dark' })}
          >
            <option value="system">기기 설정 따라가기</option>
            <option value="light">밝게</option>
            <option value="dark">어둡게</option>
          </select>
        </div>
      </section>

      <CustomVocabSection />
      <CustomWeekSection />
      <BackupSection />
    </div>
  );
}

/* ------------------------------------------------- 학교 단어장 빠른 입력 */

function CustomVocabSection() {
  const data = useAppData();
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ added: number; skipped: string[] } | null>(null);

  const add = () => {
    const parsed = parseVocabPaste(text);
    if (parsed.items.length === 0) {
      setResult({ added: 0, skipped: parsed.skipped });
      return;
    }
    registerCustomVocab({
      id: `set-${Date.now()}`,
      name: name.trim() || `단어장 ${data.customVocab.length + 1}`,
      createdAt: toISODate(),
      items: parsed.items,
    });
    setResult({ added: parsed.items.length, skipped: parsed.skipped });
    setText('');
    setName('');
  };

  return (
    <section className="card stack">
      <div className="stack stack--sm">
        <h2 className="section-title">학교 단어장 넣기</h2>
        <p className="muted">
          교과서나 시험 범위 단어를 붙여넣으면 복습 목록에 함께 들어가요. 한 줄에 하나씩,
          <code> 단어 / 뜻 </code> 형태면 돼요.
        </p>
      </div>

      <div className="field">
        <label htmlFor="setname">단어장 이름</label>
        <input
          id="setname"
          className="input"
          placeholder="예: 3과 단어"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="paste">단어 목록</label>
        <textarea
          id="paste"
          className="textarea"
          placeholder={'solve / 풀다\nproud / 자랑스러운\nsubject / 과목'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <button type="button" className="btn btn--primary" disabled={!text.trim()} onClick={add}>
        단어장 추가
      </button>

      {result && (
        <div className={`note ${result.added > 0 ? 'note--ok' : 'note--warn'}`}>
          {result.added > 0
            ? `${result.added}개를 넣었어요. 복습 화면에서 바로 나와요.`
            : '넣을 단어를 찾지 못했어요. "단어 / 뜻" 형태인지 확인해 주세요.'}
          {result.skipped.length > 0 && (
            <p className="tiny" style={{ marginTop: 4 }}>
              건너뛴 줄 {result.skipped.length}개: {result.skipped.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>
      )}

      {data.customVocab.length > 0 && (
        <ul className="stack stack--sm">
          {data.customVocab.map((set) => (
            <li key={set.id} className="vocab-list__row">
              <span>
                <strong>{set.name}</strong> · {set.items.length}개 · {set.createdAt}
              </span>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => removeCustomVocab(set.id)}
              >
                지우기
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* --------------------------------------------------- 주차 콘텐츠 가져오기 */

function CustomWeekSection() {
  const data = useAppData();
  const [text, setText] = useState('');
  const [issues, setIssues] = useState<string[] | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = (raw: string) => {
    setOk(null);
    try {
      const parsed = JSON.parse(raw);
      const problems = validateWeek(parsed, 'week');
      if (problems.length > 0) {
        setIssues(problems.slice(0, 8).map((p) => `${p.path}: ${p.message}`));
        return;
      }
      upsertCustomWeek(parsed as Week);
      setIssues(null);
      setOk(`${(parsed as Week).week}주차를 넣었어요.`);
      setText('');
    } catch {
      setIssues(['JSON 형식이 아니에요. 파일 내용을 그대로 붙여넣었는지 확인해 주세요.']);
    }
  };

  return (
    <section className="card stack">
      <div className="stack stack--sm">
        <h2 className="section-title">주차 콘텐츠 가져오기</h2>
        <p className="muted">
          직접 만든 주차 파일(JSON)을 넣으면 같은 번호의 주차를 대신해요. 형식은 저장소의{' '}
          <code>src/content/README.md</code>에 있어요.
        </p>
      </div>

      <input
        type="file"
        accept="application/json,.json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          file.text().then(load);
        }}
      />

      <div className="field">
        <label htmlFor="weekjson">또는 붙여넣기</label>
        <textarea
          id="weekjson"
          className="textarea"
          placeholder='{ "week": 7, "title": "...", ... }'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <button type="button" className="btn btn--primary" disabled={!text.trim()} onClick={() => load(text)}>
        확인하고 넣기
      </button>

      {ok && <div className="note note--ok">{ok}</div>}
      {issues && (
        <div className="note note--danger">
          <strong>이런 문제가 있어요</strong>
          <ul style={{ marginTop: 4 }}>
            {issues.map((i) => (
              <li key={i} className="tiny">
                · {i}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.customWeeks.length > 0 && (
        <ul className="stack stack--sm">
          {data.customWeeks.map((w) => (
            <li key={w.week} className="vocab-list__row">
              <span>
                <strong>{w.week}주차</strong> · {w.title}
              </span>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => removeCustomWeek(w.week)}
              >
                되돌리기
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------- 백업/초기화 */

function BackupSection() {
  const [bytes, setBytes] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    totalClipBytes()
      .then(setBytes)
      .catch(() => setBytes(null));
  }, []);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(getData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-study-backup-${toISODate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('내려받았어요. 녹음 파일은 포함되지 않아요.');
  };

  const importData = (file: File) => {
    file
      .text()
      .then((raw) => {
        replaceData(reconcile(JSON.parse(raw)));
        setMessage('가져왔어요.');
      })
      .catch(() => setMessage('파일을 읽지 못했어요.'));
  };

  return (
    <section className="card stack">
      <h2 className="section-title">백업과 초기화</h2>

      <div className="row">
        <button type="button" className="btn btn--ghost" onClick={exportData}>
          기록 내보내기
        </button>
        <label className="btn btn--ghost">
          기록 가져오기
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importData(file);
            }}
          />
        </label>
      </div>

      <p className="tiny">
        저장된 녹음 {bytes === null ? '확인 중' : `${(bytes / 1024 / 1024).toFixed(1)}MB`}
      </p>

      <div className="row">
        <button
          type="button"
          className="btn btn--sm btn--danger"
          onClick={() => {
            if (!window.confirm('저장된 녹음을 모두 지울까요? 되돌릴 수 없어요.')) return;
            clearClips()
              .then(() => {
                setBytes(0);
                setMessage('녹음을 모두 지웠어요.');
              })
              .catch(() => setMessage('녹음을 지우지 못했어요.'));
          }}
        >
          녹음 전부 지우기
        </button>
        <button
          type="button"
          className="btn btn--sm btn--danger"
          onClick={() => {
            if (!window.confirm('학습 기록을 전부 지울까요? 되돌릴 수 없어요.')) return;
            replaceData(createEmptyData());
            setMessage('처음 상태로 되돌렸어요.');
          }}
        >
          학습 기록 초기화
        </button>
      </div>

      {message && <div className="note note--ok">{message}</div>}
    </section>
  );
}
