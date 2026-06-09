/**
 * Crowd Supply 爬虫
 * 入口：https://www.crowdsupply.com
 * 策略：静态 HTML + cheerio 解析 + 详情页补充抓取
 * 修复：去重、过滤 Coming Soon、过滤未开始筹款项目、抓取价格/创始人/地点
 */
import * as cheerio from 'cheerio';
import { fetchText, sleep } from '../lib/http';
import { log } from '../lib/logger';
import type { RawCrowdfundingItem, ScrapeResult } from '../lib/types';

const LIST_URL = 'https://www.crowdsupply.com';
const BASE = 'https://www.crowdsupply.com';

/** 从项目详情页抓取 founder、location、price */
async function fetchDetail(url: string): Promise<{ founder: string; location: string; price: string }> {
  try {
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    // 价格：从产品购买区域提取
    let price = '';
    const priceEl = $('h4, .product-price, [class*="price"]').first();
    const priceText = priceEl.text().trim();
    const priceMatch = priceText.match(/\$(\d[\d,]*)/);
    if (priceMatch) {
      price = '$' + priceMatch[1];
    }
    if (!price) {
      const bodyText = $('section#products, .product-list, [class*="product"]').first().text();
      const bodyMatch = bodyText.match(/\$(\d[\d,]*)/);
      if (bodyMatch) price = '$' + bodyMatch[1];
    }
    if (!price) {
      const allText = $.html();
      const headingPriceMatch = allText.match(/<h4[^>]*>\s*\$(\d[\d,]*)/);
      if (headingPriceMatch) price = '$' + headingPriceMatch[1];
    }

    // 创始人：从 "Produced by [name]" 提取
    let founder = '';
    const producedByText = $.html();
    const producedByMatch = producedByText.match(/Produced by\s+(?:<[^>]*>)?\s*([^<]+)/i);
    if (producedByMatch) {
      founder = producedByMatch[1].trim();
    }
    if (!founder) {
      const teamMatch = producedByText.match(/About the Team[^]*?(?:href="[^"]*people[^"]*"[^>]*>)\s*([^<]+)/i);
      if (teamMatch) founder = teamMatch[1].trim();
    }

    // 地点：从 "Produced by [name] in [location]" 提取
    let location = '';
    const locationMatch = producedByText.match(/Produced by[^]*?in\s+([A-Z][^<\.]+)/i);
    if (locationMatch) {
      location = locationMatch[1].trim().replace(/\s+/g, ' ');
    }
    if (!location) {
      const locMatch2 = producedByText.match(/in\s+([A-Z][a-z]+(?:,\s*[a-z]+\.\s*[A-Z][a-z]+)?(?:,\s*[A-Z][a-z]+)?)/);
      if (locMatch2) location = locMatch2[1].trim();
    }

    return { founder: founder || 'Unknown', location: location || 'Unknown', price: price || '' };
  } catch (err) {
    log.warn('crowdsupply', `detail fetch failed for ${url}: ${err instanceof Error ? err.message : err}`);
    return { founder: 'Unknown', location: 'Unknown', price: '' };
  }
}

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
    const pendingItems: { item: RawCrowdfundingItem; url: string }[] = [];

    for (const el of cards) {
      if (pendingItems.length >= maxItems) break;
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
        pendingItems.push({ item, url });
      } catch (err) {
        result.errors.push(`card parse: ${err instanceof Error ? err.message : err}`);
      }
    }

    // 第二阶段：逐个抓取详情页补充 founder/location/price
    log.info('crowdsupply', `fetching detail pages for ${pendingItems.length} projects...`);
    for (let i = 0; i < pendingItems.length; i++) {
      const { item, url } = pendingItems[i];
      try {
        const detail = await fetchDetail(url);
        item.founder = detail.founder;
        item.location = detail.location;
        item.price = detail.price;
        log.info('crowdsupply', `detail [${i + 1}/${pendingItems.length}]: ${item.name} -> founder=${detail.founder}, loc=${detail.location}, price=${detail.price}`);
      } catch (err) {
        result.errors.push(`detail ${url}: ${err instanceof Error ? err.message : err}`);
      }
      // 礼貌间隔，避免被限流
      if (i < pendingItems.length - 1) await sleep(1200);
      result.items.push(item);
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