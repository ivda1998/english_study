import { beforeEach } from 'vitest';
import { resetData } from '@/store/storage';

beforeEach(() => {
  localStorage.clear();
  resetData('2026-03-02');
});
