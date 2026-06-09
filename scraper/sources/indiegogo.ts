/**
 * Indiegogo 爬虫
 * 入口：https://www.indiegogo.com/explore/technology
 * 策略：Playwright 动态渲染 + 详情页补充抓取
 * 分类：Technology & Innovation
 * 修复：抓取 founder/location/price
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

    // Indiegogo 的项目链接格式
    const projectLinks = $('a[href*="/projects/"]').toArray();
    log.info('indiegogo', `found ${projectLinks.length} project links`);

    const seenUrls = new Set<string>();
    let extracted = 0;
    const detailUrls: string[] = [];

    for (const el of projectLinks) {
      if (extracted >= maxItems) break;
      try {
        const $link = $(el);
        const href = $link.attr('href') || '';

        // 只取 indiegogo.com 的链接
        if (!href.includes('indiegogo.com')) continue;

        // 标准化 URL
        const cleanUrl = href.replace(':443', '').replace(/\?ref=[^&]+/, '').replace(/\/$/, '');
        if (seenUrls.has(cleanUrl)) continue;
        seenUrls.add(cleanUrl);

        // 项目名称
        const linkText = $link.text().trim();
        if (!linkText || linkText.length < 5 || /^\d/.test(linkText)) continue;

        const name = linkText.slice(0, 100).split('\n')[0].trim();
        if (!name || name.length < 3) continue;

        // 获取项目卡片容器
        const $card = $link.closest('div[class]');

        // 图片
        const imgSrc = $card.find('img').first().attr('src') || $link.find('img').first().attr('src') || '';
        const image = imgSrc.startsWith('//') ? 'https:' + imgSrc
          : imgSrc.startsWith('/') ? 'https://www.indiegogo.com' + imgSrc
          : imgSrc;

        // 描述
        const blurb = $card.find('p').first().text().trim();

        // 筹集金额
        const cardText = $card.text();
        const amountMatch = cardText.match(/\$([\d,]+\.?\d*)/);
        const raised = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

        // 支持者数
        const backersMatch = cardText.match(/(\d[\d,]*)\s*(?:backers?|funders?|supporters?)/i);
        const backers = backersMatch ? parseInt(backersMatch[1].replace(/,/g, ''), 10) : 0;

        // 进度百分比
        const pctMatch = cardText.match(/(\d+)%/);
        const progress_pct = pctMatch ? parseInt(pctMatch[1], 10) : (raised > 0 ? 100 : 0);

        const slugMatch = cleanUrl.match(/\/projects\/([^?]+)/);
        const slug = slugMatch ? slugMatch[1].replace(/\//g, '-') : name.toLowerCase().replace(/\s+/g, '-');

        const item: RawCrowdfundingItem = {
          id: `igo-${slug}`,
          platform: 'Indiegogo',
          image,
          name,
          name_zh: name,
          founder: 'Unknown',
          location: 'Unknown',
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
        detailUrls.push(cleanUrl);
        extracted++;
      } catch (err) {
        result.errors.push(`card parse: ${err instanceof Error ? err.message : err}`);
      }
    }

    // 第二阶段：用 Playwright 逐个访问详情页补充 founder/location/price
    if (detailUrls.length > 0) {
      log.info('indiegogo', `fetching detail pages for ${detailUrls.length} projects...`);
      for (let i = 0; i < detailUrls.length && i < 15; i++) {
        const url = detailUrls[i];
        try {
          const detailPage = await ctx.newPage();
          await gotoSafe(detailPage, url, { timeoutMs: 30000, waitUntil: 'domcontentloaded' });
          await detailPage.waitForTimeout(3000);
          const detailHtml = await detailPage.content();
          const $d = cheerio.load(detailHtml);

          // 创始人
          let founder = '';
          const founderEl = $d('[class*="creator"], [class*="owner"], [class*="campaigner"], a[href*="/indiegogo.com/people/"]').first();
          founder = founderEl.text().trim().replace(/^by\s+/i, '');
          if (!founder) {
            const byMatch = detailHtml.match(/by\s+([A-Z][a-zA-Z\s&.]+?)(?:\s*[·|,]|\s*<)/);
            if (byMatch) founder = byMatch[1].trim();
          }

          // 位置
          let location = '';
          const locEl = $d('[class*="location"], [class*="city"], [class*="country"]').first();
          location = locEl.text().trim();
          if (!location) {
            const locMatch = detailHtml.match(/([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)+)/);
            if (locMatch) location = locMatch[1].trim();
          }

          // 价格：从 perk/reward 区域提取最低价格
          let price = '';
          const perkEl = $d('[class*="perk"], [class*="reward"], [class*="tier"]').first();
          const perkText = perkEl.text();
          const priceMatch = perkText.match(/\$(\d[\d,]*)/);
          if (priceMatch) {
            price = '$' + priceMatch[1];
          }
          if (!price) {
            const allPrices = detailHtml.match(/\$(\d[\d,]*)/g);
            if (allPrices && allPrices.length > 0) {
              const prices = allPrices.map(p => parseInt(p.replace(/[$,]/g, ''), 10)).filter(p => p > 0);
              if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                price = '$' + minPrice.toLocaleString();
              }
            }
          }

          // 更新对应 item
          if (i < result.items.length) {
            if (founder) result.items[i].founder = founder;
            if (location) result.items[i].location = location;
            if (price) result.items[i].price = price;
            log.info('indiegogo', `detail [${i + 1}/${detailUrls.length}]: founder=${founder || 'Unknown'}, loc=${location || 'Unknown'}, price=${price || ''}`);
          }

          await detailPage.close();
        } catch (err) {
          log.warn('indiegogo', `detail fetch failed for ${url}: ${err instanceof Error ? err.message : err}`);
        }
        // 礼貌间隔
        if (i < detailUrls.length - 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
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