import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const key = 'offer-diary.v1';
async function addApplication(
  page: Page,
  company = '星河科技',
  role = '产品经理',
  options: { priority?: number; status?: string; location?: string } = {},
) {
  await page.getByRole('button', { name: '新增投递', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '记录一份新的期待' });
  await dialog.getByLabel(/^公司名称/).fill(company);
  await dialog.getByLabel(/^岗位名称/).fill(role);
  await dialog.getByLabel(/^工作地点/).fill(options.location ?? '上海');
  if (options.priority)
    await dialog
      .getByRole('button', {
        name: `设置求职意愿 ${options.priority} 星`,
        exact: true,
      })
      .click();
  if (options.status)
    await dialog.getByLabel(/^招聘状态/).selectOption(options.status);
  await dialog.getByRole('button', { name: '保存记录', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const feedback = page.getByTestId('emotional-feedback');
  if (await feedback.isVisible())
    await feedback.getByRole('button', { name: '关闭', exact: true }).click();
}
async function openApplication(page: Page, company = '星河科技') {
  await page
    .getByRole('button', { name: `查看详情 · ${company}`, exact: true })
    .click();
  return page.getByRole('dialog', { name: '求职详情', exact: true });
}
async function readStore(page: Page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key);
}
async function addInterview(page: Page, round: string, reflection: string) {
  const detail = page.getByRole('dialog', { name: '求职详情', exact: true });
  await detail
    .getByRole('button', { name: '添加面试复盘', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: '记录一次面试' });
  await dialog.getByLabel(/^面试轮次/).fill(round);
  await dialog
    .getByLabel('面试问题与回答', { exact: true })
    .fill('如何分析用户需求？从场景与目标出发。');
  await dialog.getByRole('button', { name: '尽力了', exact: true }).click();
  await dialog.getByRole('button', { name: '沟通友好', exact: true }).click();
  await dialog
    .getByLabel('给自己的补充', { exact: true })
    .fill('表达更清晰了。');
  await dialog
    .getByLabel('补充说明', { exact: true })
    .fill('耐心听完了我的问题。');
  await dialog.getByLabel('复盘与收获', { exact: true }).fill(reflection);
  await dialog.getByRole('button', { name: '保存复盘', exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('first visit is genuinely empty, bilingual, and makes no third-party requests', async ({
  page,
}) => {
  const errors: string[] = [];
  const thirdParty: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (
      !r.url().startsWith('http://127.0.0.1:5173') &&
      !r.url().startsWith('data:')
    )
      thirdParty.push(r.url());
  });
  await page.reload();
  await expect(
    page.getByText('你的求职故事，从这里开始。', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.application-card')).toHaveCount(0);
  await expect(page.locator('.stats-grid')).toHaveCount(0);
  await page.getByRole('button', { name: '界面语言', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Got an Offer Yet?', exact: true }),
  ).toBeVisible();
  expect(await page.locator('main').innerText()).not.toMatch(/[\u4e00-\u9fff]/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(errors).toEqual([]);
  expect(thirdParty).toEqual([]);
});

test('create, freely change status, edit, rate, and persist through a new browser tab', async ({
  page,
  context,
}) => {
  await addApplication(page);
  await expect(page.locator('.stat-card').first()).toContainText('01');
  await page
    .getByLabel('招聘状态 · 星河科技', { exact: true })
    .selectOption('hr');
  const detail = await openApplication(page);
  await detail
    .getByRole('button', { name: '设置求职意愿 5 星', exact: true })
    .click();
  await detail.getByRole('button', { name: '编辑', exact: true }).click();
  const form = page.getByRole('dialog', { name: '编辑求职记录' });
  await form.getByLabel(/^工作地点/).fill('杭州');
  await form.getByLabel('下一步行动', { exact: true }).fill('整理作品集');
  await form.getByLabel('行动日期', { exact: true }).fill('2026-12-01');
  await form.getByRole('button', { name: '保存修改', exact: true }).click();
  await expect(detail.getByText('杭州', { exact: true })).toBeVisible();
  await expect(page.getByTestId('emotional-feedback')).not.toBeVisible();
  const saved = (await readStore(page)).applications[0];
  expect(saved.priority).toBe(5);
  expect(saved.status).toBe('hr');
  expect(saved.nextAction).toBe('整理作品集');
  expect(saved.id).toBeTruthy();
  expect(saved.createdAt).toBeTruthy();
  await page.reload();
  await expect(page.locator('.application-card')).toContainText('杭州');
  const reopened = await context.newPage();
  await reopened.goto('/');
  await expect(reopened.locator('.application-card')).toContainText('星河科技');
  await reopened.close();
});

test('multiple interview rounds stay associated, editable, and survive closed statuses', async ({
  page,
}) => {
  await addApplication(page);
  const detail = await openApplication(page);
  await addInterview(page, '一面', '下次多用具体案例。');
  await addInterview(page, '二面', '学会了拆解指标。');
  await expect(detail.locator('.interview-entry')).toHaveCount(2);
  await detail
    .getByLabel('招聘状态', { exact: true })
    .selectOption('rejectedAfter');
  await detail
    .getByTestId('emotional-feedback')
    .getByRole('button', { name: '关闭', exact: true })
    .click();
  await expect(detail.locator('.interview-entry')).toHaveCount(2);
  await detail
    .getByRole('button', { name: '编辑面试复盘 · 一面', exact: true })
    .click();
  const edit = page.getByRole('dialog', { name: '编辑面试复盘' });
  await edit
    .getByLabel('复盘与收获', { exact: true })
    .fill('用 STAR 结构回答。');
  await edit.getByRole('button', { name: '保存复盘', exact: true }).click();
  await expect(
    detail.getByText('用 STAR 结构回答。', { exact: true }),
  ).toBeVisible();
  await detail
    .getByRole('button', { name: '删除 · 二面', exact: true })
    .click();
  await page
    .getByRole('dialog', { name: '删除这轮面试复盘？' })
    .getByRole('button', { name: '删除', exact: true })
    .click();
  await expect(detail.locator('.interview-entry')).toHaveCount(1);
  const store = await readStore(page);
  expect(store.applications[0].interviews[0].applicationId).toBe(
    store.applications[0].id,
  );
  expect(store.applications[0].interviews[0].performance).toBe('best');
  expect(store.applications[0].interviews[0].impressions).toEqual(['friendly']);
  await detail.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: /^面试复盘/ }).click();
  await expect(page.locator('.review-summary')).toHaveCount(1);
  await expect(page.locator('.review-summary')).toContainText(
    '用 STAR 结构回答。',
  );
  await page.reload();
  const reopened = await openApplication(page);
  await expect(reopened.locator('.interview-entry')).toHaveCount(1);
});

test('search, status, priority, location, favorites, and both views use real records', async ({
  page,
}) => {
  await addApplication(page, '星河科技', '产品经理', {
    priority: 5,
    status: 'first',
  });
  await addApplication(page, '暖阳设计', '交互设计师', {
    priority: 2,
    location: '杭州',
  });
  await addApplication(page, '微光工作室', '产品设计师', {
    priority: 3,
    status: 'offer',
  });
  await page
    .getByRole('textbox', { name: '搜索公司或岗位', exact: true })
    .fill('设计');
  await expect(page.locator('.application-card')).toHaveCount(2);
  await page.getByRole('button', { name: '界面语言', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Search company or role', exact: true }),
  ).toHaveValue('设计');
  await expect(page.locator('.application-card')).toHaveCount(2);
  await page
    .getByRole('button', { name: 'Interface language', exact: true })
    .click();
  await page
    .getByRole('button', { name: '重置筛选', exact: true })
    .last()
    .click();
  await page.getByLabel('招聘状态', { exact: true }).selectOption('first');
  await expect(page.locator('.application-card')).toHaveCount(1);
  await expect(page.locator('.application-card')).toContainText('星河科技');
  await page
    .getByRole('button', { name: '重置筛选', exact: true })
    .last()
    .click();
  await page.getByLabel('求职意愿', { exact: true }).selectOption('low');
  await expect(page.locator('.application-card')).toContainText('暖阳设计');
  await page.getByLabel('工作地点', { exact: true }).selectOption('上海');
  await expect(
    page.getByText('没有找到匹配的机会', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: '重置筛选', exact: true })
    .last()
    .click();
  await page.getByRole('button', { name: '列表', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(3);
  await page.getByRole('button', { name: '心动机会', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('星河科技');
});

test('feedback follows actual transitions, ordinary edits do not repeat it, and off persists', async ({
  page,
}) => {
  await addApplication(page);
  const status = page.getByLabel('招聘状态 · 星河科技', { exact: true });
  for (const value of ['rejectedBefore', 'rejectedAfter', 'offer']) {
    await status.selectOption(value);
    await expect(page.getByTestId('emotional-feedback')).toBeVisible();
    await expect(page.locator('.toast')).toHaveCount(0);
    if (value === 'offer')
      await expect(page.getByTestId('emotional-feedback')).toContainText(
        '好消息，终于等到你！',
      );
    await page
      .getByTestId('emotional-feedback')
      .getByRole('button', { name: '关闭', exact: true })
      .click();
  }
  const detail = await openApplication(page);
  await detail.getByRole('button', { name: '编辑', exact: true }).click();
  const edit = page.getByRole('dialog', { name: '编辑求职记录' });
  await edit.getByLabel(/^公司名称/).fill('星河科技（上海）');
  await edit.getByRole('button', { name: '保存修改', exact: true }).click();
  await expect(page.getByTestId('emotional-feedback')).not.toBeVisible();
  await detail.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '偏好设置', exact: true }).click();
  await page.getByRole('switch', { name: '开启情绪反馈', exact: true }).click();
  expect((await readStore(page)).settings.tone).toBe('off');
  await page.reload();
  await page
    .getByLabel('招聘状态 · 星河科技（上海）', { exact: true })
    .selectOption('first');
  await expect(page.getByTestId('emotional-feedback')).not.toBeVisible();
  await expect(page.locator('.stat-card').nth(2)).toContainText('01');
});

test('application form validates blank fields, dates, URLs, and next steps', async ({
  page,
}) => {
  await page.getByRole('button', { name: '新增投递', exact: true }).click();
  const form = page.getByRole('dialog', { name: '记录一份新的期待' });
  const save = form.getByRole('button', { name: '保存记录', exact: true });
  await save.click();
  await expect(form.getByRole('alert')).toContainText('请填写公司');
  await form.getByLabel(/^公司名称/).fill('测试公司');
  await form.getByLabel(/^岗位名称/).fill('工程师');
  await form.getByLabel(/^工作地点/).fill('北京');
  await form
    .getByLabel('招聘链接', { exact: true })
    .fill('javascript:alert(1)');
  await save.click();
  await expect(form.getByRole('alert')).toContainText('http://');
  await form
    .getByLabel('招聘链接', { exact: true })
    .fill('https://example.com/jobs');
  await form.getByLabel(/^投递日期/).fill('2099-01-01');
  await save.click();
  await expect(form.getByRole('alert')).toContainText('投递日期不能晚于今天');
  await form.getByLabel(/^投递日期/).fill('2025-01-01');
  await form.getByLabel('行动日期', { exact: true }).fill('2026-12-01');
  await save.click();
  await expect(form.getByRole('alert')).toContainText('同时填写下一步行动');
  await form.getByLabel('下一步行动', { exact: true }).fill('准备简历');
  await save.click();
  await expect(form).not.toBeVisible();
  expect((await readStore(page)).applications).toHaveLength(1);
});

test('JSON export contains saved applications, interviews, and preferences', async ({
  page,
}) => {
  await addApplication(page);
  const detail = await openApplication(page);
  await addInterview(page, '技术一面', '继续学习。');
  await detail.getByRole('button', { name: '关闭', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('button', { name: '导出备份', exact: true })
    .first()
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^offer-diary-.*\.json$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const backup = JSON.parse(Buffer.concat(chunks).toString());
  expect(backup.version).toBe(1);
  expect(backup.applications[0].interviews[0].reflection).toBe('继续学习。');
  expect(backup.settings.language).toBe('zh');
});

test('deletion warns about associated interviews, cancel preserves, confirm updates statistics', async ({
  page,
}) => {
  await addApplication(page);
  const detail = await openApplication(page);
  await addInterview(page, '一面', '下次更从容。');
  await detail.getByRole('button', { name: '删除', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: '确定删除这份记录？' });
  await expect(confirm).toContainText('所有关联面试复盘');
  await confirm.getByRole('button', { name: '取消', exact: true }).click();
  expect((await readStore(page)).applications).toHaveLength(1);
  await detail.getByRole('button', { name: '删除', exact: true }).click();
  await confirm.getByRole('button', { name: '确认删除', exact: true }).click();
  await expect(
    page.getByText('你的求职故事，从这里开始。', { exact: true }),
  ).toBeVisible();
  expect((await readStore(page)).applications).toEqual([]);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    'hidden',
  );
});

test('clear all requires confirmation and retains language and tone settings', async ({
  page,
}) => {
  await addApplication(page);
  await page.getByRole('button', { name: '偏好设置', exact: true }).click();
  await page.getByRole('button', { name: /^幽默吐槽/ }).click();
  await page.getByRole('button', { name: '清空全部数据', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: '确定清空全部记录？' });
  await confirm.getByRole('button', { name: '取消', exact: true }).click();
  expect((await readStore(page)).applications).toHaveLength(1);
  await page.getByRole('button', { name: '清空全部数据', exact: true }).click();
  await confirm.getByRole('button', { name: '确认清空', exact: true }).click();
  expect((await readStore(page)).applications).toEqual([]);
  expect((await readStore(page)).settings.tone).toBe('humor');
});

test('mobile navigation, forms, details, and English have no page overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await addApplication(page);
  await expect(page.locator('.application-card')).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const detail = await openApplication(page);
  await addInterview(page, '一面', '移动端也能记录。');
  expect(await detail.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.keyboard.press('Escape');
  await expect(detail).not.toBeVisible();
  await page.getByRole('button', { name: '打开导航', exact: true }).click();
  await page.getByRole('button', { name: '偏好设置', exact: true }).click();
  await page.getByRole('button', { name: 'En English', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Preferences', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Open navigation', exact: true })
    .click();
  await page.getByRole('button', { name: 'My journey', exact: true }).click();
  await page
    .getByRole('button', { name: 'Add application', exact: true })
    .click();
  const form = page.getByRole('dialog', {
    name: 'Make room for a possibility',
  });
  await expect(form.getByLabel(/^Company name/)).toBeVisible();
  await form
    .getByRole('button', { name: 'Save application', exact: true })
    .click();
  await expect(form.getByRole('alert')).toContainText('Please enter a company');
  expect(await form.innerText()).not.toMatch(/[\u4e00-\u9fff]/);
  expect(await form.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.keyboard.press('Escape');
});

test('unreadable local data is preserved until an explicit reset', async ({
  page,
}) => {
  await page.evaluate((k) => localStorage.setItem(k, '{broken-json'), key);
  await page.reload();
  await expect(page.locator('.storage-warning')).toBeVisible();
  await page.getByRole('button', { name: '偏好设置', exact: true }).click();
  await page.getByRole('switch').click();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    '{broken-json',
  );
  await page.getByRole('button', { name: '清空全部数据', exact: true }).click();
  await page
    .getByRole('dialog', { name: '确定清空全部记录？' })
    .getByRole('button', { name: '确认清空', exact: true })
    .click();
  await expect(page.locator('.storage-warning')).not.toBeVisible();
  expect((await readStore(page)).applications).toEqual([]);
});

test('failed browser writes leave the previous data intact and show a useful error', async ({
  page,
}) => {
  await addApplication(page);
  const before = await readStore(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };
  });
  await page
    .getByLabel('招聘状态 · 星河科技', { exact: true })
    .selectOption('offer');
  await expect(page.getByRole('alert')).toContainText('当前修改未保存');
  expect(await readStore(page)).toEqual(before);
  await expect(page.getByTestId('emotional-feedback')).not.toBeVisible();
  await expect(page.locator('.application-card .status-badge')).toContainText(
    '已投递',
  );
  await page.getByRole('button', { name: '新增投递', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '记录一份新的期待' });
  await dialog.getByLabel(/^公司名称/).fill('不能保存的公司');
  await dialog.getByLabel(/^岗位名称/).fill('设计师');
  await dialog.getByLabel(/^工作地点/).fill('北京');
  await dialog.getByRole('button', { name: '保存记录', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('当前修改未保存');
  await dialog
    .getByRole('alert')
    .getByRole('button', { name: '关闭提示' })
    .click();
  await expect(dialog).toBeVisible();
  expect(await readStore(page)).toEqual(before);
});

test('adding from a board column preselects its status', async ({ page }) => {
  await addApplication(page);
  await page
    .getByRole('button', { name: '添加记录 · 好消息来了', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: '记录一份新的期待' });
  await expect(dialog.getByLabel(/^招聘状态/)).toHaveValue('offer');
});

test('essential screens and populated details pass automated accessibility checks', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const audit = async () => {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  };
  await audit();
  await page.getByRole('button', { name: '新增投递', exact: true }).click();
  await audit();
  await page.keyboard.press('Escape');
  await addApplication(page, '星河科技', '产品经理', {
    status: 'first',
    priority: 5,
  });
  await audit();
  const detail = await openApplication(page);
  await addInterview(page, '一面', '学习到了新的视角。');
  await audit();
  await detail.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '偏好设置', exact: true }).click();
  await audit();
});

test('Chinese and English layouts fit small phones, tablets, and desktop widths', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await addApplication(
    page,
    '一家名称稍微有一点长的心动公司',
    '2027 届校园招聘 · 用户体验设计师',
    { priority: 5 },
  );
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Chinese width ${width}`,
    ).toBe(true);
  }
  await page.getByRole('button', { name: '界面语言', exact: true }).click();
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `English width ${width}`,
    ).toBe(true);
  }
});
