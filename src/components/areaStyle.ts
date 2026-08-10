import type { CSSProperties } from 'react';
import type { AreaId } from '@/content/schema';

/** 영역별 색을 CSS 변수로 넘긴다 (--area-color / --area-soft). */
export function areaVars(area: AreaId): CSSProperties {
  return {
    '--area-color': `var(--area-${area})`,
    '--area-soft': `var(--area-${area}-soft)`,
  } as CSSProperties;
}
