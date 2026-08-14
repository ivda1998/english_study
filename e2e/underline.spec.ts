import { expect, test } from '@playwright/test';

/**
 * "밑줄 친 부분…" 이라고 말하는 문항에는 화면에도 실제로 밑줄이 있어야 한다.
 * 지시문만 있고 밑줄이 없으면 어디를 가리키는지 알 수 없어 문제를 풀 수 없다.
 */
test('"밑줄 친" 문항에는 실제로 밑줄이 그려진다', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: /오늘 학습 시작하기|이어서 하기/ }).click();

  // 어휘를 지나 문법 블록으로 간다.
  for (let i = 0; i < 9; i += 1) {
    await page.getByRole('button', { name: '다음 단어' }).click();
  }
  await page.getByRole('button', { name: '문제 풀기' }).click();
  await clearQuestions(page);
  await page.getByRole('button', { name: /문제 풀기/ }).click();

  // 1일차 문법에는 밑줄 문항이 두 개 있다 — 지시문 안의 밑줄과 보기마다의 밑줄.
  let sawPromptUnderline = false;
  let sawOptionUnderline = false;

  for (let i = 0; i < 8; i += 1) {
    const prompt = page.locator('.qset__prompt');
    if (await prompt.locator('u.ul').count()) sawPromptUnderline = true;
    if (await page.locator('.qset__option u.ul').count()) sawOptionUnderline = true;

    // 지시문이 밑줄을 말하면 어딘가에는 반드시 밑줄이 있어야 한다.
    const text = (await prompt.textContent()) ?? '';
    if (text.includes('밑줄')) {
      await expect(page.locator('.qset u.ul').first()).toBeVisible();
    }
    // 밑줄 표기가 화면에 그대로 새어 나오면 안 된다.
    expect(await page.locator('.qset').innerText()).not.toContain('[[');

    if (!(await nextQuestion(page))) break;
  }

  expect(sawPromptUnderline).toBe(true);
  expect(sawOptionUnderline).toBe(true);
});

/** 현재 문항에 답하고 다음으로 넘어간다. 마지막 문항이면 false. */
async function nextQuestion(page: import('@playwright/test').Page): Promise<boolean> {
  const option = page.locator('.qset__option').first();
  if (await option.count()) await option.click();
  else {
    const input = page.locator('.qset input.input').first();
    if (await input.count()) await input.fill('x');
    else await page.locator('.qset .textarea').first().fill('내 생각');
  }
  await page.locator('.qset__foot button.btn--primary').click();
  const next = page.locator('.qset__foot button.btn--primary');
  const label = (await next.textContent())?.trim() ?? '';
  await next.click();
  return label.includes('다음 문제');
}

/** 문항 세트를 끝까지 푼다. */
async function clearQuestions(page: import('@playwright/test').Page) {
  for (let i = 0; i < 20; i += 1) {
    if (!(await nextQuestion(page))) return;
  }
  throw new Error('문항이 끝나지 않았습니다');
}
