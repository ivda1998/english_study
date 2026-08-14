import { describe, expect, it } from 'vitest';
import { hasMarkup, isMarkupBalanced, parseMarkup, stripMarkup } from './markup';

describe('parseMarkup', () => {
  it('밑줄이 없으면 통째로 한 조각이다', () => {
    expect(parseMarkup('She looks happy.')).toEqual([
      { text: 'She looks happy.', underline: false },
    ]);
  });

  it('문장 가운데 밑줄을 잘라낸다', () => {
    expect(parseMarkup('He feels [[sadly]].')).toEqual([
      { text: 'He feels ', underline: false },
      { text: 'sadly', underline: true },
      { text: '.', underline: false },
    ]);
  });

  it('밑줄이 문장 맨 앞이나 맨 뒤에 있어도 된다', () => {
    expect(parseMarkup('[[That one]] is closer.')).toEqual([
      { text: 'That one', underline: true },
      { text: ' is closer.', underline: false },
    ]);
    expect(parseMarkup('people call that [[talent]]')).toEqual([
      { text: 'people call that ', underline: false },
      { text: 'talent', underline: true },
    ]);
  });

  it('한 문장에 밑줄이 여러 개일 수 있다', () => {
    expect(parseMarkup('[[A]] and [[B]]')).toEqual([
      { text: 'A', underline: true },
      { text: ' and ', underline: false },
      { text: 'B', underline: true },
    ]);
  });

  it('줄바꿈을 건너서도 잡는다', () => {
    expect(parseMarkup('지시문\n[[two words]] here')).toEqual([
      { text: '지시문\n', underline: false },
      { text: 'two words', underline: true },
      { text: ' here', underline: false },
    ]);
  });

  it('빈 문자열은 조각이 없다', () => {
    expect(parseMarkup('')).toEqual([]);
  });
});

describe('stripMarkup', () => {
  it('표기를 걷어낸 문장을 준다', () => {
    expect(stripMarkup('He feels [[sadly]].')).toBe('He feels sadly.');
  });

  it('밑줄이 없으면 그대로다', () => {
    expect(stripMarkup('She looks happy.')).toBe('She looks happy.');
  });
});

describe('hasMarkup', () => {
  it('밑줄 유무를 알려준다', () => {
    expect(hasMarkup('He feels [[sadly]].')).toBe(true);
    expect(hasMarkup('He feels sadly.')).toBe(false);
  });

  it('여러 번 불러도 결과가 흔들리지 않는다', () => {
    const text = 'He feels [[sadly]].';
    expect(hasMarkup(text)).toBe(true);
    expect(hasMarkup(text)).toBe(true);
  });
});

describe('isMarkupBalanced', () => {
  it('짝이 맞으면 통과한다', () => {
    expect(isMarkupBalanced('He feels [[sadly]].')).toBe(true);
    expect(isMarkupBalanced('밑줄 없는 문장')).toBe(true);
  });

  it('닫지 않았거나 열지 않았으면 잡아낸다', () => {
    expect(isMarkupBalanced('He feels [[sadly.')).toBe(false);
    expect(isMarkupBalanced('He feels sadly]].')).toBe(false);
  });
});
