import { expect, test, type Page } from '@playwright/test';

/** 문항 세트를 끝까지 푼다. 정답 여부는 상관없다 — 흐름이 끊기지 않는지 본다. */
async function answerAllQuestions(page: Page) {
  for (let guard = 0; guard < 40; guard += 1) {
    const option = page.locator('.qset__option').first();
    if (await option.count()) {
      await option.click();
    } else {
      const input = page.locator('.qset input.input').first();
      const textarea = page.locator('.qset .textarea').first();
      if (await input.count()) await input.fill('answer');
      else if (await textarea.count()) await textarea.fill('내 생각');
    }

    await page.locator('.qset__foot button.btn--primary').click();

    const nextButton = page.locator('.qset__foot button.btn--primary');
    const label = (await nextButton.textContent())?.trim() ?? '';
    await nextButton.click();
    if (!label.includes('다음 문제')) return label;
  }
  throw new Error('문항이 끝나지 않았습니다');
}

test('하루 세션을 끝까지 진행하고 진도가 저장된다', async ({ page }) => {
  await page.goto('./');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('link', { name: /오늘 학습 시작하기|이어서 하기/ }).click();
  await expect(page.getByRole('tab', { name: /어휘/ })).toBeVisible();

  // 1) 어휘 — 단어 10장을 넘기고 자동 생성된 문제를 푼다
  for (let i = 0; i < 9; i += 1) {
    await page.getByRole('button', { name: '다음 단어' }).click();
  }
  await page.getByRole('button', { name: '문제 풀기' }).click();
  await answerAllQuestions(page);

  // 2) 문법
  await expect(page.getByRole('tab', { name: /문법/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: /문제 풀기/ }).click();
  await answerAllQuestions(page);

  // 3) 독해
  await expect(page.getByRole('tab', { name: /독해/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: /다 읽었어요/ }).click();
  await answerAllQuestions(page);

  // 4) 듣기 — 문항을 풀고 받아쓰기까지
  await expect(page.getByRole('tab', { name: /듣기/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: '문제 풀기' }).click();
  await answerAllQuestions(page);

  for (let guard = 0; guard < 5; guard += 1) {
    const box = page.locator('.textarea');
    if (!(await box.count())) break;
    await box.fill('I write what I hear.');
    await page.getByRole('button', { name: '확인' }).click();
    const next = page.getByRole('button', { name: /다음 문장|듣기 끝내기/ });
    const label = (await next.textContent()) ?? '';
    await next.click();
    if (label.includes('듣기 끝내기')) break;
  }
  await page.getByRole('button', { name: '말하기로 넘어가기' }).click();

  // 5) 말하기 — 4단계 탭이 보이고, 끝내면 하루가 완료된다
  await expect(page.getByRole('tab', { name: /따라 읽기/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /질문에 답하기/ })).toBeVisible();
  await page.getByRole('button', { name: '말하기 끝내기' }).click();

  await expect(page.getByText('오늘 학습 완료')).toBeVisible();

  // 새로고침해도 진도가 남아 있어야 한다
  await page.goto('./');
  await expect(page.getByText('1일 완주')).toBeVisible();

  // 부모 화면에도 반영된다
  await page.getByRole('link', { name: '부모' }).click();
  await expect(page.getByRole('heading', { name: '부모 화면' })).toBeVisible();
  await expect(page.getByText('완주한 날')).toBeVisible();
  await expect(page.locator('.stat__value').first()).toHaveText('1일');
});

test('말하기 15분인 날에만 1분 말하기 탭이 열린다', async ({ page }) => {
  // 월요일(w01d1)은 말하기 10분 — ①~③만
  await page.goto('./#/day/w01d1');
  await page.locator('.stepper').getByRole('tab', { name: /말하기/ }).click();
  await expect(page.getByRole('tab', { name: /1분 말하기/ })).toHaveCount(0);

  // 화요일(w01d2)은 말하기 15분 — ④가 열리고 수학 말하기도 있다
  await page.goto('./#/day/w01d2');
  await page.locator('.stepper').getByRole('tab', { name: /말하기/ }).click();
  await expect(page.getByRole('tab', { name: /1분 말하기/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /수학으로 말하기/ })).toBeVisible();
});

test('마이크를 못 써도 1분 말하기가 진행되고 기록이 남는다', async ({ page }) => {
  // 마이크 권한이 거부된 상황을 흉내 낸다.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () => Promise.reject(new DOMException('denied', 'NotAllowedError')),
      },
    });
  });

  await page.goto('./#/day/w01d2');
  await page.locator('.stepper').getByRole('tab', { name: /말하기/ }).click();
  await page.getByRole('tab', { name: /1분 말하기/ }).click();

  await page.getByRole('button', { name: /시작하기/ }).click();
  await expect(page.locator('.mic__time')).toBeVisible();

  await page.getByRole('button', { name: /다 말했어요/ }).click();
  await expect(page.getByText('오늘 말해보니 어땠어요?')).toBeVisible();
  await page.getByRole('button', { name: '할 만했어요' }).click();
  await page.getByRole('button', { name: '기록 저장' }).click();
  await expect(page.getByText('기록했어요. 오늘 말하기 끝!')).toBeVisible();

  // 성장 기록에 반영된다
  await page.goto('./#/stats');
  await expect(page.getByRole('heading', { name: '최근 말하기' })).toBeVisible();
  await expect(page.getByText('My favorite subject').first()).toBeVisible();
  await expect(page.getByText('1분 말하기').first()).toBeVisible();

  // 부모 화면에서는 녹음이 없다는 사실이 그대로 보인다
  await page.goto('./#/parent');
  await expect(page.getByText('녹음 없이 시간만 기록했어요')).toBeVisible();
});

test('주요 화면이 모바일 폭에서 가로로 넘치지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['./', './#/plan', './#/review', './#/stats', './#/parent', './#/settings']) {
    await page.goto(path);
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `가로 스크롤 발생: ${path}`).toBeLessThanOrEqual(1);
  }
});
