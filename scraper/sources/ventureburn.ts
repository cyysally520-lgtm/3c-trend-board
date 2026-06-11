/**
 * Ventureburn 爬虫
 * 入口：https://ventureburn.com/feed/ (RSS XML)
 * 策略：RSS feed 解析 → 提取最新科技创投文章
 */
import * as cheerio from 'cheerio';
import { fetchText, sleep } from '../lib/http';
import { log } from '../lib/logger';
import type { RawNewsItem, ScrapeResult } from '../lib/types';

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

  try {
    log.info('ventureburn', `fetching RSS: ${RSS_URL}`);
    const rssXml = await fetchText(RSS_URL, {
      headers: { Accept: 'application/xml, text/xml, */*' },
    });
    const $ = cheerio.load(rssXml, { xmlMode: true });

    const items = $('item').toArray().slice(0, maxItems);
    log.info('ventureburn', `RSS has ${items.length} items`);

    for (const el of items) {
      try {
        const title = $(el).find('title').first().text().trim();
        const link = $(el).find('link').first().text().trim();
        const pubDate = $(el).find('pubDate').first().text().trim();
        const description = $(el).find('description').first().text().trim();

        if (!title || !link) continue;

        // 从 description 中提取纯文本 snippet
        const snippet = cheerio.load(description).text().trim().slice(0, 300);

        // 提取图片：优先 media:thumbnail / enclosure，其次 content:encoded 里的 img
        const image =
          $(el).find('media\\:thumbnail, thumbnail').attr('url') ||
          $(el).find('enclosure').attr('url') ||
          '';

        // 如果 enclosure/media 没找到，尝试从 content:encoded 提取
        let finalImage = image;
        if (!finalImage) {
          const contentEncoded = $(el).find('content\\:encoded, encoded').first().html() || '';
          const $content = cheerio.load(contentEncoded);
          finalImage = $content('img').first().attr('src') || '';
        }

        // 从分类推断中文标签
        const categories = $(el).find('category').toArray()
          .map(c => $(c).text().trim())
          .filter(Boolean);
        const categoryTag = mapCategory(categories[0] || '');

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
        result.errors.push(`item: ${err instanceof Error ? err.message : err}`);
      }
    }

    result.ok = result.items.length > 0;
    log.ok('ventureburn', `extracted ${result.items.length} items`);
  } catch (err) {
    log.err('ventureburn', 'scrape failed', err);
    result.errors.push(err instanceof Error ? err.message : String(err));
  }

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