export interface ParsedVocab {
  word: string;
  meaning: string;
}

export interface ParseResult {
  items: ParsedVocab[];
  /** 해석하지 못한 줄 (사용자에게 그대로 보여준다) */
  skipped: string[];
}

/**
 * 학교 단어장을 붙여넣기로 받는다.
 * 탭, 쉼표, 슬래시, 하이픈, 콜론, 여러 칸 공백 중 무엇으로 나눠도 인식한다.
 * 교재에서 복사하면 형식이 제각각이라 최대한 너그럽게 받는 편이 낫다.
 */
export function parseVocabPaste(text: string): ParseResult {
  const items: ParsedVocab[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // 앞에 붙은 번호(1. 1) 등)는 떼어낸다.
    const withoutIndex = line.replace(/^\d+\s*[.)]\s*/, '');
    const match = withoutIndex.match(/^(.+?)\s*(?:\t|,|\/|:|—|–|-{1,2}|\s{2,})\s*(.+)$/);

    if (!match) {
      skipped.push(line);
      continue;
    }

    const word = match[1].trim();
    const meaning = match[2].trim();
    if (!word || !meaning) {
      skipped.push(line);
      continue;
    }

    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ word, meaning });
  }

  return { items, skipped };
}
