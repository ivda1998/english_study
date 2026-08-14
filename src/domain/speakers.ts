/**
 * 듣기 대화에서 화자를 목소리로 구분한다.
 *
 * 한 목소리가 A와 B를 번갈아 읽으면 누가 말하는지 알 수 없어 대화가 뒤엉킨다.
 * 기기에 영어 목소리가 여러 개 있으면 화자마다 다른 목소리를 주고,
 * 하나뿐이면 음 높이를 달리해서 최소한의 구분은 만든다.
 */

/** 목소리가 모자랄 때 화자를 가르는 음 높이. 첫 화자는 평소 높이 그대로. */
export const SPEAKER_PITCHES = [1, 0.8, 1.2, 0.9];

export interface SpeakerStyle {
  /** 몇 번째 목소리를 쓸지 (목소리 목록 길이로 나눈 나머지) */
  voiceIndex: number;
  pitch: number;
}

/** 화자 이름을 등장 순서대로 0, 1, 2… 로 번호 매긴다. */
export function speakerOrder(speakers: (string | undefined)[]): Map<string, number> {
  const order = new Map<string, number>();
  for (const s of speakers) {
    if (s && !order.has(s)) order.set(s, order.size);
  }
  return order;
}

/**
 * 화자 번호 → 쓸 목소리와 음 높이.
 * 목소리가 충분하면 목소리로만 가르고, 모자라면 음 높이까지 함께 쓴다.
 */
export function styleFor(speakerIndex: number, voiceCount: number): SpeakerStyle {
  if (voiceCount <= 1) {
    return { voiceIndex: 0, pitch: SPEAKER_PITCHES[speakerIndex % SPEAKER_PITCHES.length] };
  }
  const voiceIndex = speakerIndex % voiceCount;
  const round = Math.floor(speakerIndex / voiceCount);
  return { voiceIndex, pitch: SPEAKER_PITCHES[round % SPEAKER_PITCHES.length] };
}
