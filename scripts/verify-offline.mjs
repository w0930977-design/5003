import { chromium, expect } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const html = await readFile(
  new URL('../dist/offer-diary.html', import.meta.url),
  'utf8',
);
const profile = await mkdtemp(path.join(tmpdir(), 'offer-offline-'));
const pageUrl = 'http://127.0.0.1:5173/offline-verification';
const errors = [];
const extraRequests = [];
let context;

async function openOfflineBrowser() {
  context = await chromium.launchPersistentContext(profile, {
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox'],
    offline: true,
  });
  // The cloud browser blocks file: URLs by administrator policy. Supply only the
  // HTML via interception, with networking disabled and no web server involved.
  await context.route('**/*', async (route) => {
    if (route.request().url() === pageUrl) {
      await route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: html,
      });
    } else {
      extraRequests.push(route.request().url());
      await route.abort();
    }
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(pageUrl);
  return page;
}

try {
  let page = await openOfflineBrowser();
  await expect(
    page.getByRole('heading', { name: '今天你收到 Offer 了吗？', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '新增投递', exact: true }).click();
  const form = page.getByRole('dialog', { name: '记录一份新的期待' });
  await form.getByLabel(/^公司名称/).fill('离线验证公司');
  await form.getByLabel(/^岗位名称/).fill('产品设计师');
  await form.getByLabel(/^工作地点/).fill('上海');
  await form
    .getByRole('button', { name: '设置求职意愿 5 星', exact: true })
    .click();
  await form.getByRole('button', { name: '保存记录', exact: true }).click();
  await page
    .getByRole('button', { name: '查看详情 · 离线验证公司', exact: true })
    .click();
  await page
    .getByRole('dialog', { name: '求职详情' })
    .getByRole('button', { name: '添加面试复盘', exact: true })
    .first()
    .click();
  const interview = page.getByRole('dialog', { name: '记录一次面试' });
  await interview.getByLabel(/^面试轮次/).fill('作品集一面');
  await interview
    .getByLabel('复盘与收获', { exact: true })
    .fill('无需联网也能保存复盘。');
  await interview
    .getByRole('button', { name: '保存复盘', exact: true })
    .click();
  await page
    .getByRole('dialog', { name: '求职详情' })
    .getByRole('button', { name: '关闭', exact: true })
    .click();
  await page.getByRole('button', { name: '界面语言', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Export backup', exact: true })
    .first()
    .click();
  const download = await downloadPromise;
  const backupPath = path.join(profile, 'backup.json');
  await download.saveAs(backupPath);
  const backup = JSON.parse(await readFile(backupPath, 'utf8'));
  expect(backup.applications[0].interviews[0].reflection).toBe(
    '无需联网也能保存复盘。',
  );
  expect(backup.applications[0].priority).toBe(5);
  await context.close();

  page = await openOfflineBrowser();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.application-card')).toContainText('离线验证公司');
  await page
    .getByRole('button', { name: 'View details · 离线验证公司', exact: true })
    .click();
  const detail = page.getByRole('dialog', {
    name: 'Application details',
    exact: true,
  });
  await expect(detail).toContainText('无需联网也能保存复盘。');
  await detail.getByRole('button', { name: 'Delete', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Delete this application?', exact: true })
    .getByRole('button', { name: 'Delete application', exact: true })
    .click();
  await page.reload();
  await expect(page.locator('.application-card')).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(extraRequests).toEqual([]);
  console.log(
    'Standalone HTML verified without networking or a web server: create, rating, interview, JSON export, bilingual settings, persistence across browser restart, mobile details, and deletion.',
  );
  console.log(
    'Direct file: navigation is blocked by this cloud browser policy and must be checked on the user device.',
  );
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}
