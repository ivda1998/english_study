/**
 * 문항 텍스트 안의 밑줄 표기.
 *
 * 시험 문항은 "밑줄 친 부분이 어법상 틀린 것은?" 처럼 지문의 특정 구간을 가리킨다.
 * JSON 콘텐츠에서는 `[[...]]` 로 그 구간을 감싸고, 화면에서 밑줄로 그린다.
 *
 *   "He feels [[sadly]]."  →  He feels ̲s̲a̲d̲l̲y̲.
 *
 * 대괄호 두 개를 고른 이유는 영어 문장과 한국어 지시문 어디에도 자연스럽게
 * 나타나지 않아서, 이스케이프 없이 그대로 쓸 수 있기 때문이다.
 */

export const UNDERLINE_OPEN = '[[';
export const UNDERLINE_CLOSE = ']]';

export interface TextSegment {
  text: string;
  underline: boolean;
}

// 전역 정규식은 lastIndex를 들고 다녀서 호출 사이에 상태가 새므로 매번 새로 만든다.
function pattern(): RegExp {
  return /\[\[(.+?)\]\]/gs;
}

/** `[[...]]` 를 기준으로 문자열을 밑줄 구간과 일반 구간으로 나눈다. */
export function parseMarkup(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;

  for (const match of text.matchAll(pattern())) {
    const start = match.index;
    if (start > last) segments.push({ text: text.slice(last, start), underline: false });
    segments.push({ text: match[1], underline: true });
    last = start + match[0].length;
  }

  if (last < text.length) segments.push({ text: text.slice(last), underline: false });
  return segments;
}

/** 밑줄 표기를 걷어낸 순수 텍스트. 음성 읽기·채점·정답 비교에 쓴다. */
export function stripMarkup(text: string): string {
  return parseMarkup(text)
    .map((s) => s.text)
    .join('');
}

/** 밑줄 구간이 하나라도 있는지 */
export function hasMarkup(text: string): boolean {
  return parseMarkup(text).some((s) => s.underline);
}

/**
 * 여닫는 표기가 짝이 맞는지. 콘텐츠 검증에서 쓴다.
 * 열기만 있거나 닫기만 있는 경우를 잡는다.
 */
export function isMarkupBalanced(text: string): boolean {
  const stripped = stripMarkup(text);
  return !stripped.includes(UNDERLINE_OPEN) && !stripped.includes(UNDERLINE_CLOSE);
}
