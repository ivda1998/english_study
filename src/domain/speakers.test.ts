import { describe, expect, it } from 'vitest';
import { SPEAKER_PITCHES, speakerOrder, styleFor } from './speakers';

describe('speakerOrder', () => {
  it('등장 순서대로 번호를 매긴다', () => {
    const order = speakerOrder(['Mina', 'Jiho', 'Mina', 'Jiho']);
    expect(order.get('Mina')).toBe(0);
    expect(order.get('Jiho')).toBe(1);
    expect(order.size).toBe(2);
  });

  it('화자가 없는 줄은 건너뛴다', () => {
    const order = speakerOrder([undefined, 'Mina', undefined]);
    expect(order.get('Mina')).toBe(0);
    expect(order.size).toBe(1);
  });

  it('화자가 하나도 없으면 비어 있다', () => {
    expect(speakerOrder([undefined, undefined]).size).toBe(0);
  });
});

describe('styleFor', () => {
  it('목소리가 하나뿐이면 음 높이로 가른다', () => {
    const a = styleFor(0, 1);
    const b = styleFor(1, 1);
    expect(a.voiceIndex).toBe(0);
    expect(b.voiceIndex).toBe(0);
    expect(a.pitch).not.toBe(b.pitch);
  });

  it('목소리가 여럿이면 목소리로 가르고 음 높이는 건드리지 않는다', () => {
    const a = styleFor(0, 2);
    const b = styleFor(1, 2);
    expect(a.voiceIndex).toBe(0);
    expect(b.voiceIndex).toBe(1);
    expect(a.pitch).toBe(1);
    expect(b.pitch).toBe(1);
  });

  it('화자가 목소리보다 많으면 음 높이를 함께 쓴다', () => {
    const third = styleFor(2, 2);
    expect(third.voiceIndex).toBe(0);
    expect(third.pitch).toBe(SPEAKER_PITCHES[1]);
    // 첫 화자와 같은 목소리를 쓰더라도 음 높이가 달라 구분된다
    expect(third.pitch).not.toBe(styleFor(0, 2).pitch);
  });

  it('첫 화자는 늘 평소 음 높이다', () => {
    expect(styleFor(0, 1).pitch).toBe(1);
    expect(styleFor(0, 3).pitch).toBe(1);
  });
});
