/**
 * NextBanker ShadowGlow 爬虫
 * 入口：https://nextbanker.cn/  （AI硬件板块）
 * 策略：静态 HTML + cheerio 解析（已确认页面服务端渲染）
 *
 * 每个项目卡片结构：
 *   h4.标题 + tagline
 *   **技术：** ... **商业：** ... **团队：** ... **运营：** ... **融资：**
 */
import * as cheerio from 'cheerio';
import { fetchText } from '../lib/http';
import { log } from '../lib/logger';
import type { RawInvestItem, ScrapeResult } from '../lib/types';

const BASE_URL = 'https://nextbanker.cn/';

export async function scrapeNextbanker(maxItems = 96): Promise<ScrapeResult<RawInvestItem>> {
  const t0 = Date.now();
  const result: ScrapeResult<RawInvestItem> = {
    source: 'NextBanker',
    ok: false,
    items: [],
    errors: [],
    durationMs: 0,
  };

  try {
    log.info('nextbanker', `fetching: ${BASE_URL}`);
    const html = await fetchText(BASE_URL, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });
    const $ = cheerio.load(html);

    // 找到 AI硬件 板块的标题，然后取其后所有项目卡片
    // 每个项目卡是 <h4> 标题 + 后续 <p> 标签内容
    let rank = 0;
    let inAIHardware = false;

    // 遍历所有 h3（板块标题）和 h4（项目标题）
    $('h3, h4').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const text = $(el).text().trim();

      if (tag === 'h3') {
        // 检测是否进入 AI硬件 板块
        inAIHardware = text.includes('AI硬件');
        return;
      }

      if (!inAIHardware || tag !== 'h4') return;
      if (result.items.length >= maxItems) return;

      rank++;
      try {
        // 项目名称：去掉序号前缀
        const name = text.replace(/^\d+\s*/, '').split(/\s{2,}/)[0].trim();

        // tagline：h4 文字中序号后面的标签信息（如 "KS $400K+"）
        const tagline = text.replace(/^\d+\s*/, '').replace(name, '').trim();

        // 找到该 h4 后面的所有内容直到下一个 h4/h3
        let contentHtml = '';
        let nextEl = $(el).next();
        while (nextEl.length && !['h3', 'h4'].includes(nextEl.prop('tagName')?.toLowerCase() ?? '')) {
          contentHtml += nextEl.text() + '\n';
          nextEl = nextEl.next();
        }

        // 解析各字段
        const tech = extractField(contentHtml, '技术');
        const business = extractField(contentHtml, '商业');
        const team = extractField(contentHtml, '团队');
        const operations = extractField(contentHtml, '运营');
        const funding = extractField(contentHtml, '融资');

        // 几天前：从内容中找 "X天前" 或 "X小时前"
        const daysMatch = contentHtml.match(/(\d+)\s*天前/);
        const hoursMatch = contentHtml.match(/(\d+)\s*小时前/);
        const daysAgo = daysMatch
          ? parseInt(daysMatch[1], 10)
          : hoursMatch
            ? 0
            : 0;

        // 子分类：从 tagline 或 name 推断（可选，留空也可）
        const category = guessCat(name + ' ' + tagline);

        if (!name) return;

        const item: RawInvestItem = {
          id: `nb-${rank}-${name.slice(0, 20).replace(/\s+/g, '-')}`,
          rank,
          name,
          tagline: tagline || '',
          category,
          tech: tech.slice(0, 500),
          business: business.slice(0, 500),
          team: team.slice(0, 300),
          operations: operations.slice(0, 300),
          funding: funding.slice(0, 200),
          daysAgo,
          source_url: BASE_URL,
          scrapedAt: new Date().toISOString(),
        };
        result.items.push(item);
      } catch (err) {
        result.errors.push(`card[${rank}]: ${err instanceof Error ? err.message : err}`);
      }
    });

    result.ok = result.items.length > 0;
    log.ok('nextbanker', `extracted ${result.items.length} invest items`);
  } catch (err) {
    log.err('nextbanker', 'scrape failed', err);
    result.errors.push(err instanceof Error ? err.message : String(err));
  }

  result.durationMs = Date.now() - t0;
  return result;
}

function extractField(text: string, field: string): string {
  // 匹配 **字段：** 到下一个 **字段：** 之间的内容
  const re = new RegExp(`\\*{0,2}${field}[：:]\\*{0,2}\\s*([\\s\\S]*?)(?=\\*{0,2}(?:技术|商业|团队|运营|融资|信号)[：:]|$)`);
  const m = text.match(re);
  return m ? m[1].trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ') : '';
}

function guessCat(text: string): string {
  if (/眼镜|AR|MR|XR/.test(text)) return 'AI眼镜';
  if (/戒指|Ring/.test(text)) return 'AI戒指';
  if (/耳机|翻译/.test(text)) return 'AI耳机';
  if (/机器人|Robot/.test(text)) return '桌面机器人';
  if (/陪伴|宠物/.test(text)) return 'AI陪伴';
  if (/穿戴|可穿戴|Wearable/.test(text)) return 'AI穿戴';
  return 'AI硬件';
}