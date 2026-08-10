import { useMemo } from 'react';
import { BUILTIN_WEEKS } from '@/content';
import type { Week } from '@/content/schema';
import { mergeWeeks } from '@/domain/curriculum';
import { useAppData } from '@/store/actions';

/** 기본 커리큘럼 + 사용자가 직접 넣은 주차를 합쳐서 돌려준다. */
export function useCurriculum(): Week[] {
  const { customWeeks } = useAppData();
  return useMemo(() => mergeWeeks(BUILTIN_WEEKS, customWeeks), [customWeeks]);
}
