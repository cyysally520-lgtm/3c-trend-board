/**
 * Ventureburn 爬虫
 * 入口1：https://ventureburn.com/category/news/ai/ (AI分类页)
 * 入口2：https://ventureburn.com/feed/ (RSS XML，作为补充)
 * 策略：优先爬取 AI 分类页 → RSS feed 补充
 */
import * as cheerio from 'cheerio';
import { fetchText, sleep } from '../lib/http';
import { log } from '../lib/logger';
import type { RawNewsItem, ScrapeResult } from '../lib/types';

const AI_CATEGORY_URL = 'https://ventureburn.com/category/news/ai/';
const RSS_URL = 'https://ventureburn.com/feed/';

export async function scrapeVentureburn(maxItems = 30): Promise<ScrapeResult<RawNewsItem>> {
  const t0 = Date.now();
  const result: ScrapeResult<RawNewsItem> = {
    source: 'Ventureburn',
    ok: false,
    items: [],
    errors: [],
    durationMs: 0,
  };

  const seenUrls = new Set<string>();

  // ===== 第一步：爬取 AI 分类页 =====
  try {
    log.info('ventureburn', `fetching AI category: ${AI_CATEGORY_URL}`);
    const html = await fetchText(AI_CATEGORY_URL, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const $ = cheerio.load(html);

    // 提取文章卡片（常见选择器：article, .post, .entry）
    const articles = $('article, .post, .entry, .td-module-wrap, .elementor-post').toArray();
    log.info('ventureburn', `AI category page has ${articles.length} articles`);

    for (const el of articles) {
      if (result.items.length >= maxItems) break;
      try {
        const linkEl = $(el).find('a[href]').first();
        const link = linkEl.attr('href') || '';
        if (!link || seenUrls.has(link) || !link.includes('ventureburn.com')) continue;

        const title = $(el).find('h2, h3, .entry-title, .td-module-title a, .elementor-post__title a').first().text().trim();
        if (!title) continue;

        const snippet = $(el).find('p, .entry-summary, .td-excerpt, .elementor-post__excerpt').first().text().trim().slice(0, 300);
        const image = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';

        seenUrls.add(link);

        const item: RawNewsItem = {
          id: `vb-${hashUrl(link)}`,
          source: 'Ventureburn',
          image,
          title,
          title_zh: title,
          publishedAt: new Date().toISOString(),
          snippet,
          snippet_zh: [snippet],
          url: link,
          category_tag_zh: '#AI应用',
          scrapedAt: new Date().toISOString(),
        };
        result.items.push(item);
      } catch (err) {
        result.errors.push(`ai-page-item: ${err instanceof Error ? err.message : err}`);
      }
    }

    log.ok('ventureburn', `AI category extracted ${result.items.length} items`);
  } catch (err) {
    log.err('ventureburn', 'AI category page scrape failed, falling back to RSS', err);
    result.errors.push(`ai-page: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ===== 第二步：RSS feed 补充 =====
  if (result.items.length < maxItems) {
    try {
      log.info('ventureburn', `fetching RSS supplement: ${RSS_URL}`);
      const rssXml = await fetchText(RSS_URL, {
        headers: { Accept: 'application/xml, text/xml, */*' },
      });
      const $ = cheerio.load(rssXml, { xmlMode: true });

      const items = $('item').toArray().slice(0, maxItems);
      log.info('ventureburn', `RSS has ${items.length} items`);

      for (const el of items) {
        if (result.items.length >= maxItems) break;
        try {
          const title = $(el).find('title').first().text().trim();
          const link = $(el).find('link').first().text().trim();
          if (!title || !link || seenUrls.has(link)) continue;

          const description = $(el).find('description').first().text().trim();
          const snippet = cheerio.load(description).text().trim().slice(0, 300);

          const image =
            $(el).find('media\\:thumbnail, thumbnail').attr('url') ||
            $(el).find('enclosure').attr('url') ||
            '';
          let finalImage = image;
          if (!finalImage) {
            const contentEncoded = $(el).find('content\\:encoded, encoded').first().html() || '';
            const $content = cheerio.load(contentEncoded);
            finalImage = $content('img').first().attr('src') || '';
          }

          const categories = $(el).find('category').toArray()
            .map(c => $(c).text().trim())
            .filter(Boolean);
          const categoryTag = mapCategory(categories[0] || '');

          const pubDate = $(el).find('pubDate').first().text().trim();
          seenUrls.add(link);

          const item: RawNewsItem = {
            id: `vb-${hashUrl(link)}`,
            source: 'Ventureburn',
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
      log.err('ventureburn', 'RSS scrape failed', err);
      result.errors.push(`rss: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  result.ok = result.items.length > 0;
  log.ok('ventureburn', `total extracted ${result.items.length} items`);
  result.durationMs = Date.now() - t0;
  return result;
}

function mapCategory(cat: string): string {
  const map: Record<string, string> = {
    'AI': 'AI应用', 'Artificial Intelligence': 'AI应用',
    'Startups': 'AI创业', 'Venture Capital': 'AI投资', 'Funding': 'AI投资',
    'Fintech': '金融科技', 'Health': '医疗科技',
    'E-commerce': '电商科技', 'SaaS': 'SaaS',
    'Africa': '新兴市场', 'Emerging Markets': '新兴市场',
    'Hardware': '极客硬件', 'Gadgets': '数码外设',
  };
  return `#${map[cat] || '科技创投'}`;
}

function hashUrl(u: string): string {
  return u.split('/').filter(Boolean).pop()?.slice(0, 50) || Math.random().toString(36).slice(2, 8);
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  scrapeVentureburn(5).then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ok ? 0 : 1);
  });
}