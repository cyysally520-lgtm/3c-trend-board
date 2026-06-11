/**
 * The Verge 爬虫
 * 入口：https://www.theverge.com/rss/index.xml (RSS XML)
 * 策略：RSS feed 解析 → 提取最新科技文章
 */
import * as cheerio from 'cheerio';
import { fetchText, sleep } from '../lib/http';
import { log } from '../lib/logger';
import type { RawNewsItem, ScrapeResult } from '../lib/types';

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

  try {
    log.info('theverge', `fetching RSS: ${RSS_URL}`);
    const rssXml = await fetchText(RSS_URL, {
      headers: { Accept: 'application/xml, text/xml, */*' },
    });
    const $ = cheerio.load(rssXml, { xmlMode: true });

    // The Verge RSS uses <entry> (Atom) or <item> (RSS 2.0)
    const entries = $('entry, item').toArray().slice(0, maxItems);
    log.info('theverge', `RSS has ${entries.length} entries`);

    for (const el of entries) {
      try {
        const title = $(el).find('title').first().text().trim();
        // Atom uses <link href="...">, RSS uses <link>text</link>
        const link =
          $(el).find('link[href]').attr('href') ||
          $(el).find('link').first().text().trim();
        const pubDate =
          $(el).find('published').first().text().trim() ||
          $(el).find('pubDate').first().text().trim() ||
          $(el).find('updated').first().text().trim();
        // Atom uses <summary>, RSS uses <description>
        const description =
          $(el).find('summary').first().text().trim() ||
          $(el).find('description').first().text().trim();

        if (!title || !link) continue;

        const snippet = cheerio.load(description).text().trim().slice(0, 300);

        // 提取图片
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

        // 从分类推断中文标签
        const categories = $(el).find('category').toArray()
          .map(c => $(c).text().trim() || $(c).attr('term') || '')
          .filter(Boolean);
        const categoryTag = mapCategory(categories[0] || '');

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
        result.errors.push(`item: ${err instanceof Error ? err.message : err}`);
      }
    }

    result.ok = result.items.length > 0;
    log.ok('theverge', `extracted ${result.items.length} items`);
  } catch (err) {
    log.err('theverge', 'scrape failed', err);
    result.errors.push(err instanceof Error ? err.message : String(err));
  }

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