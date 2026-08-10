/**
 * 커리큘럼 JSON 검증기.
 * `npm test` 와 `npm run build` 앞에서 돌아가며, 잘못된 콘텐츠가 배포되는 것을 막는다.
 *
 *   npx tsx scripts/validate-content.ts
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateWeek, type Week } from '../src/content/schema.ts';
import { SPEAKING_TOPICS } from '../src/content/topics.ts';

/**
 * 이 파일은 tsx로 직접 실행되기도 하고 vitest 안에서 import 되기도 한다.
 * vitest가 변환한 모듈에서는 import.meta.url이 file: URL이 아닐 수 있으므로
 * 실패하면 실행 디렉터리(저장소 루트)를 쓴다.
 */
function resolveRoot(): string {
  try {
    return fileURLToPath(new URL('..', import.meta.url));
  } catch {
    return process.cwd();
  }
}

const CURRICULUM_DIR = join(resolveRoot(), 'src/content/curriculum');

export interface FileIssue {
  file: string;
  path: string;
  message: string;
}

export function loadWeekFiles(): { file: string; week: Week }[] {
  let names: string[];
  try {
    names = readdirSync(CURRICULUM_DIR).filter((n) => /^week-\d+\.json$/.test(n));
  } catch {
    return [];
  }
  return names.sort().map((file) => ({
    file,
    week: JSON.parse(readFileSync(join(CURRICULUM_DIR, file), 'utf8')) as Week,
  }));
}

export function validateAll(files = loadWeekFiles()): FileIssue[] {
  const issues: FileIssue[] = [];

  files.forEach(({ file, week }) => {
    for (const issue of validateWeek(week, 'week')) {
      issues.push({ file, path: issue.path, message: issue.message });
    }

    // 파일 이름과 주차 번호가 어긋나면 로딩 순서가 꼬인다.
    const expected = `week-${String(week.week).padStart(2, '0')}.json`;
    if (file !== expected) {
      issues.push({ file, path: 'week', message: `파일 이름은 ${expected} 여야 합니다` });
    }

    // 말하기 주제 30개는 설계에서 확정된 문구와 순서를 그대로 지킨다.
    const expectedTopics = SPEAKING_TOPICS[week.week - 1];
    if (expectedTopics) {
      if (JSON.stringify(week.speakingTopics) !== JSON.stringify([...expectedTopics])) {
        issues.push({
          file,
          path: 'week.speakingTopics',
          message: `확정된 주제 목록과 다릅니다.\n  기대: ${expectedTopics.join(' | ')}\n  실제: ${(week.speakingTopics ?? []).join(' | ')}`,
        });
      }
      // 1분 말하기 주제는 그 주 주제 5개 안에서 나와야 한다.
      week.days?.forEach((day, i) => {
        const topic = day?.speaking?.oneMinute?.topic;
        if (topic && !expectedTopics.includes(topic)) {
          issues.push({
            file,
            path: `week.days[${i}].speaking.oneMinute.topic`,
            message: `이 주의 말하기 주제 5개 중 하나여야 합니다: ${topic}`,
          });
        }
      });
    }
  });

  // 주차 번호는 1부터 빠짐없이 이어져야 한다.
  const numbers = files.map((f) => f.week.week).sort((a, b) => a - b);
  numbers.forEach((n, i) => {
    if (n !== i + 1) {
      issues.push({
        file: '(전체)',
        path: 'week',
        message: `주차 번호가 이어지지 않습니다: ${numbers.join(', ')}`,
      });
    }
  });

  // 수학 연결 말하기는 주당 1회 이상 있어야 한다 (설계 의도).
  files.forEach(({ file, week }) => {
    const count = (week.days ?? []).filter((d) => d?.speaking?.mathTalk).length;
    if (count < 1) {
      issues.push({ file, path: 'week.days', message: '수학 연결 말하기가 주 1회는 있어야 합니다' });
    }
  });

  return issues;
}

/** 스크립트로 직접 실행했을 때만 결과를 출력한다. */
function runningAsScript(): boolean {
  try {
    return Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === process.argv[1];
  } catch {
    return false;
  }
}

const isMain = runningAsScript();
if (isMain) {
  const files = loadWeekFiles();
  const issues = validateAll(files);

  if (files.length === 0) {
    console.log('⚠ 커리큘럼 파일이 아직 없습니다 (src/content/curriculum/week-NN.json)');
  }

  if (issues.length === 0) {
    const days = files.reduce((sum, f) => sum + (f.week.days?.length ?? 0), 0);
    console.log(`✓ 콘텐츠 검증 통과 — ${files.length}개 주차, ${days}일`);
    process.exit(0);
  }

  console.error(`✗ 콘텐츠 문제 ${issues.length}건\n`);
  for (const issue of issues) {
    console.error(`  [${issue.file}] ${issue.path}\n    ${issue.message}`);
  }
  process.exit(1);
}
