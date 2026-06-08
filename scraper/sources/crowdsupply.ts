/**
 * Crowd Supply 爬虫
 * 入口：https://www.crowdsupply.com
 * 策略：静态 HTML + cheerio 解析
 * 修复：去重、过滤 Coming Soon、过滤未开始筹款项目
 */
import * as cheerio from 'cheerio';
import { fetchText } from '../lib/http';
import { log } from '../lib/logger';
import type { RawCrowdfundingItem, ScrapeResult } from '../lib/types';

const LIST_URL = 'https://www.crowdsupply.com';
const BASE = 'https://www.crowdsupply.com';

export async function scrapeCrowdSupply(maxItems = 20): Promise<ScrapeResult<RawCrowdfundingItem>> {
  const t0 = Date.now();
  const result: ScrapeResult<RawCrowdfundingItem> = {
    source: 'Crowd Supply',
    ok: false,
    items: [],
    errors: [],
    durationMs: 0,
  };

  try {
    log.info('crowdsupply', `fetching homepage: ${LIST_URL}`);
    const html = await fetchText(LIST_URL);
    const $ = cheerio.load(html);

    const cards = $('a.project-tile').toArray();
    log.info('crowdsupply', `found ${cards.length} project-tile cards`);

    const seenUrls = new Set<string>();
    let extracted = 0;

    for (const el of cards) {
      if (extracted >= maxItems) break;
      try {
        const $card = $(el);
        const href = $card.attr('href') || '';
        const url = href.startsWith('http') ? href : BASE + href;
        if (!href || seenUrls.has(url)) continue;

        const name = $card.find('h3').first().text().trim();
        if (!name) continue;

        // 过滤掉 Coming Soon 项目
        const statusText = $card.find('.status-bar').first().text().trim();
        if (statusText.toLowerCase().includes('coming soon')) continue;

        const imgSrc = $card.children('img').first().attr('src') || '';
        const image = imgSrc.startsWith('//') ? 'https:' + imgSrc
          : imgSrc.startsWith('/') ? BASE + imgSrc
          : imgSrc;

        const blurb = $card.find('.project-tile-overview p').first().text().trim();

        const facts = $card.find('.factoids .fact').toArray();
        let raised = 0;
        let backers = 0;
        for (const fact of facts) {
          const label = $(fact).find('.fact-label').text().trim().toLowerCase();
          const numText = $(fact).find('.fact-number').text().replace(/[^0-9.]/g, '').trim();
          const num = parseFloat(numText) || 0;
          if (label === 'raised') raised = num;
          if (label === 'backers') backers = Math.round(num);
        }

        // 过滤掉未开始筹款的项目
        if (raised === 0 && backers === 0) continue;

        // 进度百分比：从 status-bar 解析实际超募百分比
        const pctMatch = statusText.match(/(\d[\d,]*)\s*%/);
        const progress_pct = pctMatch ? parseInt(pctMatch[1].replace(/,/g, ''), 10) : 100;

        const slug = href.split('/').filter(Boolean).join('-') || name.toLowerCase().replace(/\s+/g, '-');
        seenUrls.add(url);

        const item: RawCrowdfundingItem = {
          id: `cs-${slug}`,
          platform: 'Crowd Supply',
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
          campaign_url: url,
          category_tag_zh: '#硬件',
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
    log.ok('crowdsupply', `extracted ${result.items.length} items`);
  } catch (err) {
    log.err('crowdsupply', 'scrape failed', err);
    result.errors.push(err instanceof Error ? err.message : String(err));
  }

  result.durationMs = Date.now() - t0;
  return result;
}