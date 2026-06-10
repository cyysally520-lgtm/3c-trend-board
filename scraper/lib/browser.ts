/**
 * Playwright 浏览器实例管理（动态页面爬取）
 * 复用单一 browser，按需创建独立 context（隔离 cookie）
 * 
 * 反 Cloudflare 策略：
 * 1. playwright-extra + stealth 插件（最关键，自动修补指纹检测）
 * 2. CI 环境支持 headed 模式（PLAYWRIGHT_HEADED=1 + Xvfb）
 * 3. 注入反检测脚本（webdriver、chrome runtime、plugins、languages）
 * 4. 随机 UA、合理的 viewport/locale/timezone/Sec-Ch-Ua headers
 * 5. Kickstarter 专用：waitForCloudflare() 等待验证通过 + 页面刷新重试
 */
import { chromium as playwrightChromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { randomUA } from './http';
import { log } from './logger';

let _browser: Browser | null = null;

// 动态导入 playwright-extra + stealth（可选依赖，安装了就用，没安装回退原版）
async function getStealthChromium() {
  try {
    const { chromium } = await import('playwright-extra');
    try {
      const stealth = await import('puppeteer-extra-plugin-stealth');
      chromium.use(stealth.default());
      log.info('browser', 'playwright-extra + stealth plugin loaded');
    } catch {
      log.info('browser', 'playwright-extra loaded (stealth plugin not available)');
    }
    return chromium;
  } catch {
    log.info('browser', 'playwright-extra not available, using standard playwright');
    return playwrightChromium;
  }
}

export async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser;
  // CI 环境中通过 PLAYWRIGHT_HEADED=1 启用 headed 模式绕过 Cloudflare
  const headed = process.env.PLAYWRIGHT_HEADED === '1';
  const chromiumLauncher = await getStealthChromium();
  log.info('browser', `launching chromium (headed=${headed}, stealth=${chromiumLauncher !== playwrightChromium})...`);
  _browser = await chromiumLauncher.launch({
    headless: !headed,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1440,900',
    ],
  });
  return _browser;
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = null;
    log.info('browser', 'closed');
  }
}

/**
 * 创建一个隔离的浏览器上下文 + 反检测设置
 */
export async function newContext(): Promise<BrowserContext> {
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    userAgent: randomUA(),
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Sec-Ch-Ua': '"Chromium";v="137", "Google Chrome";v="137"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
    },
  });
  // 注入反检测脚本（stealth 插件会自动做大部分，这里补充）
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    // @ts-ignore
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });
  return ctx;
}

/**
 * 带超时的页面加载（goto 包装）
 * 默认等到 networkidle，便于动态站点采集
 */
export async function gotoSafe(
  page: Page,
  url: string,
  opts: { timeoutMs?: number; waitUntil?: 'load' | 'networkidle' | 'domcontentloaded' | 'commit' } = {}
) {
  const { timeoutMs = 45000, waitUntil = 'networkidle' } = opts;
  try {
    await page.goto(url, { waitUntil, timeout: timeoutMs });
  } catch (err) {
    // 降级策略：networkidle → domcontentloaded → load → commit
    const fallbacks: ('domcontentloaded' | 'load' | 'commit')[] = ['domcontentloaded', 'load', 'commit'];
    for (const fb of fallbacks) {
      if (fb === waitUntil) continue;
      try {
        log.warn('browser', `gotoSafe degrade to ${fb} for ${url}`);
        await page.goto(url, { waitUntil: fb, timeout: timeoutMs });
        return;
      } catch {
        continue;
      }
    }
    // 所有降级都失败，最后尝试 commit（几乎一定会成功）
    try {
      await page.goto(url, { waitUntil: 'commit', timeout: 15000 });
    } catch (finalErr) {
      log.warn('browser', `gotoSafe all fallbacks failed for ${url}`);
      throw finalErr;
    }
  }
}

/**
 * 等待 Cloudflare 验证通过
 * 检测页面标题是否从 "Just a moment..." 变为实际页面标题
 * 返回 true 表示验证通过，false 表示超时
 */
export async function waitForCloudflare(page: Page, maxWaitSec = 60): Promise<boolean> {
  for (let i = 0; i < maxWaitSec / 5; i++) {
    const title = await page.title();
    // 空标题也表示页面还没加载完成
    const isChallenge = !title
      || title.includes('moment')
      || title.includes('Cloudflare')
      || title.includes('Checking')
      || title.includes('Redirect');
    if (!isChallenge) {
      log.info('browser', `Cloudflare challenge passed (title: "${title}")`);
      return true;
    }
    log.info('browser', `waiting for Cloudflare... (${i + 1}) title="${title}"`);
    await page.waitForTimeout(5000);
  }
  return false;
}