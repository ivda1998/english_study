import type { Week } from './schema';

/**
 * content/curriculum/week-*.json 을 자동으로 등록한다.
 * 새 주차 파일을 추가하면 코드를 고치지 않아도 커리큘럼에 반영된다.
 */
const modules = import.meta.glob('./curriculum/week-*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

export const BUILTIN_WEEKS: Week[] = Object.keys(modules)
  .sort()
  .map((key) => modules[key] as Week);
