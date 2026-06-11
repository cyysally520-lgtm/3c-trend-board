/**
 * The Verge 爬虫
 * 入口1：https://www.theverge.com/tech (Tech分类页，Playwright动态渲染)
 * 入口2：https://www.theverge.com/rss/index.xml (RSS XML，作为补充)
 * 策略：优先爬取 /tech 页面 → RSS feed 补充
 */
import * as cheerio from 'cheerio';
import { fetchText, sleep } from '../lib/http';
import { newContext, gotoSafe } from '../lib/browser';
import { log } from '../lib/logger';
import type { RawNewsItem, ScrapeResult } from '../lib/types';

const TECH_URL = 'https://www.theverge.com/tech';
const RSS_URL = 'https://www.theverge.com/rss/index.xml';

export async function scrapeTheVerge(maxItems = 30): Promise<ScrapeResult<RawNewsItem>> {
  const t0 = Date.now();
  const result: ScrapeResult<RawNewsItem> = {
    source: 'The Verge',
    ok: false,
    items: [],
    errors: [],
    durationMs: 0,
  };

  const seenUrls = new Set<string>();

  // ===== 第一步：Playwright 爬取 /tech 页面 =====
  const ctx = await newContext();
  const page = await ctx.newPage();
  try {
    log.info('theverge', `loading tech page: ${TECH_URL}`);
    await gotoSafe(page, TECH_URL, { timeoutMs: 60000 });
    await page.waitForTimeout(5000);

    // 滚动加载更多文章
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 1500));
      await page.waitForTimeout(2000);
    }

    // 提取文章卡片数据
    const rawItems = await page.evaluate((max) => {
      const articles: any[] = [];
      const cards = document.querySelectorAll('article, [class*="article"], [class*="story"], [class*="post"], a[href*="/tech/"], a[href*="/202"]');
      const seen = new Set<string>();

      for (const card of cards) {
        if (articles.length >= max) break;
        try {
          // 找链接
          const linkEl = card.tagName === 'A' ? card : card.querySelector('a[href]');
          if (!linkEl) continue;
          const url = (linkEl as HTMLAnchorElement).href;
          if (!url || seen.has(url) || !url.includes('theverge.com')) continue;
          seen.add(url);

          // 找标题
          const titleEl = card.querySelector('h2, h3, [class*="title"], [class*="headline"]') || linkEl;
          const title = titleEl?.textContent?.trim() || '';
          if (!title || title.length < 10) continue;

          // 找图片
          const imgEl = card.querySelector('img');
          const image = imgEl?.src || imgEl?.getAttribute('data-src') || '';

          // 找摘要
          const snippetEl = card.querySelector('p, [class*="excerpt"], [class*="summary"], [class*="dek"]');
          const snippet = snippetEl?.textContent?.trim().slice(0, 300) || '';

          articles.push({ url, title, image, snippet });
        } catch {}
      }
      return articles;
    }, maxItems);

    log.info('theverge', `tech page extracted ${rawItems.length} raw items`);

    for (const raw of rawItems) {
      if (result.items.length >= maxItems) break;
      if (seenUrls.has(raw.url)) continue;
      seenUrls.add(raw.url);

      const item: RawNewsItem = {
        id: `tv-${hashUrl(raw.url)}`,
        source: 'The Verge',
        image: raw.image || '',
        title: raw.title,
        title_zh: raw.title,
        publishedAt: new Date().toISOString(),
        snippet: raw.snippet || '',
        snippet_zh: [raw.snippet || ''],
        url: raw.url,
        category_tag_zh: '#科技前沿',
        scrapedAt: new Date().toISOString(),
      };
      result.items.push(item);
    }

    log.ok('theverge', `tech page extracted ${result.items.length} items`);
  } catch (err) {
    log.err('theverge', 'tech page scrape failed, falling back to RSS', err);
    result.errors.push(`tech-page: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await page.close().catch(() => {});
  }

  // ===== 第二步：RSS feed 补充 =====
  if (result.items.length < maxItems) {
    try {
      log.info('theverge', `fetching RSS supplement: ${RSS_URL}`);
      const rssXml = await fetchText(RSS_URL, {
        headers: { Accept: 'application/xml, text/xml, */*' },
      });
      const $ = cheerio.load(rssXml, { xmlMode: true });

      const entries = $('entry, item').toArray().slice(0, maxItems);
      log.info('theverge', `RSS has ${entries.length} entries`);

      for (const el of entries) {
        if (result.items.length >= maxItems) break;
        try {
          const title = $(el).find('title').first().text().trim();
          const link =
            $(el).find('link[href]').attr('href') ||
            $(el).find('link').first().text().trim();
          if (!title || !link || seenUrls.has(link)) continue;

          const pubDate =
            $(el).find('published').first().text().trim() ||
            $(el).find('pubDate').first().text().trim() ||
            $(el).find('updated').first().text().trim();
          const description =
            $(el).find('summary').first().text().trim() ||
            $(el).find('description').first().text().trim();
          const snippet = cheerio.load(description).text().trim().slice(0, 300);

          const image =
            $(el).find('media\\:content, content[url]').attr('url') ||
            $(el).find('media\\:thumbnail, thumbnail').attr('url') ||
            $(el).find('enclosure').attr('url') ||
            '';
          let finalImage = image;
          if (!finalImage) {
            const contentHtml =
              $(el).find('content').first().html() ||
              $(el).find('content\\:encoded, encoded').first().html() ||
              '';
            const $content = cheerio.load(contentHtml);
            finalImage = $content('img').first().attr('src') || '';
          }

          const categories = $(el).find('category').toArray()
            .map(c => $(c).text().trim() || $(c).attr('term') || '')
            .filter(Boolean);
          const categoryTag = mapCategory(categories[0] || '');
          seenUrls.add(link);

          const item: RawNewsItem = {
            id: `tv-${hashUrl(link)}`,
            source: 'The Verge',
            image: finalImage,
            title,
            title_zh: title,
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            snippet,
            snippet_zh: [snippet],
            url: link,
            category_tag_zh: categoryTag,
            scrapedAt: new Date().toISOString(),
          };
          result.items.push(item);
        } catch (err) {
          result.errors.push(`rss-item: ${err instanceof Error ? err.message : err}`);
        }
      }
    } catch (err) {
      log.err('theverge', 'RSS scrape failed', err);
      result.errors.push(`rss: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  result.ok = result.items.length > 0;
  log.ok('theverge', `total extracted ${result.items.length} items`);
  result.durationMs = Date.now() - t0;
  return result;
}

function mapCategory(cat: string): string {
  const map: Record<string, string> = {
    'AI': 'AI应用', 'Artificial Intelligence': 'AI应用',
    'Tech': '科技前沿', 'Science': '科技前沿',
    'Reviews': '数码评测', 'Hardware': '极客硬件',
    'Phones': '数码外设', 'Tablets': '数码外设',
    'Laptops': '便携生产力', 'Computers': '便携生产力',
    'Audio': '数码外设', 'Wearables': 'AR眼镜',
    'VR': 'AR/VR眼镜', 'AR': 'AR/VR眼镜',
    'Cars': '智能汽车', 'Transportation': '智能汽车',
    'Policy': 'AI安全', 'Privacy': 'AI安全',
    'Startups': 'AI创业',
  };
  return `#${map[cat] || '科技前沿'}`;
}

function hashUrl(u: string): string {
  return u.split('/').filter(Boolean).pop()?.slice(0, 50) || Math.random().toString(36).slice(2, 8);
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  scrapeTheVerge(5).then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ok ? 0 : 1);
  });
}