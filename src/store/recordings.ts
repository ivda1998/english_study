/**
 * 말하기 녹음 파일 저장소.
 * 오디오는 용량이 커서 localStorage에 넣을 수 없으므로 IndexedDB에 보관한다.
 * 어떤 경우에도 네트워크로 나가지 않는다 — 이 기기 안에서만 존재한다.
 */

const DB_NAME = 'english-study-recordings';
const DB_VERSION = 1;
const STORE = 'clips';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('이 브라우저는 녹음 저장을 지원하지 않습니다.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('녹음 저장소를 열지 못했습니다.'));
  });
}

export interface StoredClip {
  id: string;
  blob: Blob;
  mimeType: string;
  seconds: number;
  createdAt: string;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = fn(tx.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('녹음 처리에 실패했습니다.'));
    });
  } finally {
    db.close();
  }
}

export async function saveClip(clip: StoredClip): Promise<void> {
  await withStore('readwrite', (store) => store.put(clip));
}

export async function loadClip(id: string): Promise<StoredClip | undefined> {
  return withStore<StoredClip | undefined>('readonly', (store) => store.get(id));
}

export async function deleteClip(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id));
}

export async function listClipIds(): Promise<string[]> {
  const keys = await withStore<IDBValidKey[]>('readonly', (store) => store.getAllKeys());
  return keys.map(String);
}

export async function clearClips(): Promise<void> {
  await withStore('readwrite', (store) => store.clear());
}

/** 저장된 녹음 총 용량(바이트). 설정 화면에서 보여준다. */
export async function totalClipBytes(): Promise<number> {
  const clips = await withStore<StoredClip[]>('readonly', (store) => store.getAll());
  return clips.reduce((sum, c) => sum + (c.blob?.size ?? 0), 0);
}
