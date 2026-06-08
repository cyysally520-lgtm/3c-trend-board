/**
 * Indiegogo 爬虫
 * 入口：https://www.indiegogo.com/explore/technology
 * 策略：Playwright 动态渲染 + cheerio 解析
 * 分类：Technology & Innovation
 */
import * as cheerio from 'cheerio';
import { newContext, gotoSafe } from '../lib/browser';
import { log } from '../lib/logger';
import type { RawCrowdfundingItem, ScrapeResult } from '../lib/types';

const EXPLORE_URL = 'https://www.indiegogo.com/explore/technology?project_type=all&project_timing=all&sort=trending';

export async function scrapeIndiegogo(maxItems = 30): Promise<ScrapeResult<RawCrowdfundingItem>> {
  const t0 = Date.now();
  const result: ScrapeResult<RawCrowdfundingItem> = {
    source: 'Indiegogo',
    ok: false,
    items: [],
    errors: [],
    durationMs: 0,
  };

  const ctx = await newContext();
  const page = await ctx.newPage();

  try {
    log.info('indiegogo', `loading: ${EXPLORE_URL}`);
    await gotoSafe(page, EXPLORE_URL, { timeoutMs: 60000 });

    // 等待页面 JS 渲染完成（Indiegogo 是重度 SPA）
    await page.waitForTimeout(8000);

    // 滚动加载更多项目
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, 1200));
      await page.waitForTimeout(2500);
    }

    // 等待项目链接出现
    await page.waitForSelector('a[href*="/projects/"]', { timeout: 30000 }).catch(() => {
      log.warn('indiegogo', 'project links selector timeout, trying anyway');
    });

    // 再等一下确保渲染完成
    await page.waitForTimeout(3000);

    const html = await page.content();
    const $ = cheerio.load(html);

    // Indiegogo 的项目链接格式：indiegogo.com/en/projects/...
    const projectLinks = $('a[href*="/projects/"]').toArray();
    log.info('indiegogo', `found ${projectLinks.length} project links`);

    const seenUrls = new Set<string>();
    let extracted = 0;

    for (const el of projectLinks) {
      if (extracted >= maxItems) break;
      try {
        const $link = $(el);
        const href = $link.attr('href') || '';

        // 只取 indiegogo.com 的链接，跳过 gamefound 等跨平台链接
        if (!href.includes('indiegogo.com')) continue;

        // 标准化 URL（去掉 :443 端口和 ref 参数）
        const cleanUrl = href.replace(':443', '').replace(/\?ref=[^&]+/, '').replace(/\/$/, '');
        if (seenUrls.has(cleanUrl)) continue;
        seenUrls.add(cleanUrl);

        // 项目名称 - 从链接文本或子元素获取
        const linkText = $link.text().trim();
        // 找到有实质文本的链接（跳过只有数字的链接如 "2.2k"）
        if (!linkText || linkText.length < 5 || /^\d/.test(linkText)) continue;

        const name = linkText.slice(0, 100).split('\n')[0].trim();
        if (!name || name.length < 3) continue;

        // 获取项目卡片容器（向上找父级）
        const $card = $link.closest('div[class]');

        // 图片
        const imgSrc = $card.find('img').first().attr('src') || $link.find('img').first().attr('src') || '';
        const image = imgSrc.startsWith('//') ? 'https:' + imgSrc
          : imgSrc.startsWith('/') ? 'https://www.indiegogo.com' + imgSrc
          : imgSrc;

        // 描述
        const blurb = $card.find('p').first().text().trim();

        // 筹集金额 - 从卡片文本中提取
        const cardText = $card.text();
        const amountMatch = cardText.match(/\$([\d,]+\.?\d*)/);
        const raised = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

        // 支持者数
        const backersMatch = cardText.match(/(\d[\d,]*)\s*(?:backers?|funders?|supporters?)/i);
        const backers = backersMatch ? parseInt(backersMatch[1].replace(/,/g, ''), 10) : 0;

        // 进度百分比
        const pctMatch = cardText.match(/(\d+)%/);
        const progress_pct = pctMatch ? parseInt(pctMatch[1], 10) : (raised > 0 ? 100 : 0);

        // 发起人
        const founder = 'Unknown';

        // 位置
        const location = 'Unknown';

        const slugMatch = cleanUrl.match(/\/projects\/([^?]+)/);
        const slug = slugMatch ? slugMatch[1].replace(/\//g, '-') : name.toLowerCase().replace(/\s+/g, '-');

        const item: RawCrowdfundingItem = {
          id: `igo-${slug}`,
          platform: 'Indiegogo',
          image,
          name,
          name_zh: name,
          founder,
          location,
          raised,
          currency: 'USD',
          currencySymbol: '$',
          progress_pct,
          backers,
          price: '',
          campaign_url: cleanUrl,
          category_tag_zh: '#科技',
          summary_zh: blurb ? [blurb.slice(0, 200)] : [],
          scrapedAt: new Date().toISOString(),
        };
        result.items.push(item);
        extracted++;
      } catch (err) {
        result.errors.push(`card parse: ${err instanceof Error ? err.message : err}`);
      }
    }

    result.ok = result.items.length > 0;
    log.ok('indiegogo', `extracted ${result.items.length} items`);
  } catch (err) {
    log.err('indiegogo', 'scrape failed', err);
    result.errors.push(err instanceof Error ? err.message : String(err));
  } finally {
    await page.close();
    await ctx.close();
  }

  result.durationMs = Date.now() - t0;
  return result;
}