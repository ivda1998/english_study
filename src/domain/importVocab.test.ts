import { describe, expect, it } from 'vitest';
import { parseVocabPaste } from './importVocab';

describe('단어장 붙여넣기', () => {
  it('여러 구분자를 모두 인식한다', () => {
    const { items } = parseVocabPaste(
      ['solve\t풀다', 'proud, 자랑스러운', 'subject / 과목', 'useful: 유용한', 'reason - 이유', 'effort   노력'].join('\n'),
    );
    expect(items).toEqual([
      { word: 'solve', meaning: '풀다' },
      { word: 'proud', meaning: '자랑스러운' },
      { word: 'subject', meaning: '과목' },
      { word: 'useful', meaning: '유용한' },
      { word: 'reason', meaning: '이유' },
      { word: 'effort', meaning: '노력' },
    ]);
  });

  it('앞에 붙은 번호를 떼어낸다', () => {
    const { items } = parseVocabPaste('1. improve / 향상시키다\n2) explain / 설명하다');
    expect(items).toEqual([
      { word: 'improve', meaning: '향상시키다' },
      { word: 'explain', meaning: '설명하다' },
    ]);
  });

  it('여러 단어로 된 표제어도 받는다', () => {
    const { items } = parseVocabPaste('look forward to\t~을 기대하다');
    expect(items).toEqual([{ word: 'look forward to', meaning: '~을 기대하다' }]);
  });

  it('중복은 한 번만 넣는다', () => {
    const { items } = parseVocabPaste('solve / 풀다\nSOLVE / 해결하다');
    expect(items).toHaveLength(1);
  });

  it('해석하지 못한 줄은 따로 알려준다', () => {
    const { items, skipped } = parseVocabPaste('solve / 풀다\n이건뜻이없는줄\n\n  ');
    expect(items).toHaveLength(1);
    expect(skipped).toEqual(['이건뜻이없는줄']);
  });
});
