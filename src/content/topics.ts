/**
 * 말하기 주제 30개 — 설계 단계에서 확정된 목록이며 문구와 순서를 바꾸지 않는다.
 * 콘텐츠 검증 테스트가 각 주차 JSON의 speakingTopics와 이 목록이 정확히 일치하는지 확인한다.
 */
export const SPEAKING_TOPICS: readonly (readonly string[])[] = [
  // 1주차 — 아주 쉬운 주제
  [
    'My favorite subject',
    'My favorite food',
    'My favorite book',
    'My favorite movie',
    'My weekend',
  ],
  // 2주차 — 자기 생각 말하기
  [
    'Why I like math',
    "A subject I don't like",
    'My favorite teacher',
    'My best friend',
    "Something I'm good at",
  ],
  // 3주차 — 경험 이야기
  [
    'Something funny that happened',
    'A difficult problem I solved',
    'A book I recently read',
    'A movie I watched',
    'My best day this year',
  ],
  // 4주차 — 생각하기
  [
    'Is homework necessary?',
    'Which is better, books or movies?',
    'Should students use smartphones at school?',
    'Is math difficult?',
    'What makes a good teacher?',
  ],
  // 5주차 — 조금 더 높은 수준
  [
    'My dream job',
    'A country I want to visit',
    'What I want to learn',
    'What makes me happy',
    'What I would change about my school',
  ],
  // 6주차 — 사고력 활용
  [
    'If I could change one thing in the world',
    'If I had one million dollars',
    'A problem teenagers have',
    'What makes a person successful?',
    'What I think is more important: talent or effort?',
  ],
] as const;

export const WEEK_TOPIC_LABEL: readonly string[] = [
  '아주 쉬운 주제',
  '자기 생각 말하기',
  '경험 이야기',
  '생각하기',
  '조금 더 높은 수준',
  '사고력 활용',
];

export const TOTAL_WEEKS = SPEAKING_TOPICS.length;
