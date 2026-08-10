import { describe, expect, it } from 'vitest';
import { loadWeekFiles, validateAll } from '../../scripts/validate-content';
import { PASSAGE_LENGTH_TARGET, countWords } from './schema';
import { SPEAKING_TOPICS } from './topics';
import { TIMETABLE, WEEKDAYS } from '@/domain/timetable';

const files = loadWeekFiles();

describe('커리큘럼 콘텐츠', () => {
  it('검증기를 통과한다', () => {
    const issues = validateAll(files);
    const report = issues.map((i) => `[${i.file}] ${i.path}: ${i.message}`).join('\n');
    expect(report).toBe('');
  });

  it('주차 파일이 최소 1개는 있다', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('각 주차는 5일이고 요일이 월~금 순서다', () => {
    for (const { week } of files) {
      expect(week.days).toHaveLength(5);
      expect(week.days.map((d) => d.dayOfWeek)).toEqual(WEEKDAYS);
    }
  });

  it('말하기 주제가 확정된 30개 목록과 일치한다', () => {
    for (const { week } of files) {
      expect(week.speakingTopics).toEqual([...SPEAKING_TOPICS[week.week - 1]]);
    }
  });

  it('1분 말하기는 말하기 15분인 요일에만 있다', () => {
    for (const { week } of files) {
      for (const day of week.days) {
        const has = Boolean(day.speaking.oneMinute);
        expect(has).toBe(TIMETABLE[day.dayOfWeek].speaking >= 15);
      }
    }
  });

  it('지문 길이가 주차별 목표 범위 안에 있다 (난이도가 점진적으로 오른다)', () => {
    for (const { week } of files) {
      const target = PASSAGE_LENGTH_TARGET[week.week];
      for (const day of week.days) {
        const words = countWords(day.reading.passage.body);
        expect(words, `${day.id} 지문 ${words}단어`).toBeGreaterThanOrEqual(target.min);
        expect(words, `${day.id} 지문 ${words}단어`).toBeLessThanOrEqual(target.max);
      }
    }
  });

  it('모든 객관식 문항의 정답 인덱스가 유효하다', () => {
    for (const { week } of files) {
      for (const day of week.days) {
        const all = [...day.grammar.exercises, ...day.reading.questions, ...day.listening.questions];
        for (const q of all) {
          if (q.kind !== 'choice') continue;
          expect(q.answer, `${day.id} ${q.id}`).toBeGreaterThanOrEqual(0);
          expect(q.answer, `${day.id} ${q.id}`).toBeLessThan(q.options.length);
        }
      }
    }
  });

  it('따라 읽기 문장은 그날 지문에서 가져온다', () => {
    for (const { week } of files) {
      for (const day of week.days) {
        const body = day.reading.passage.body.replace(/\s+/g, ' ');
        for (const sentence of day.speaking.shadowing) {
          expect(body, `${day.id}: ${sentence}`).toContain(sentence.replace(/\s+/g, ' '));
        }
      }
    }
  });
});
