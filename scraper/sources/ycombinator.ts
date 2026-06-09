/**
 * Y Combinator 爬虫
 * 完全复用 YC 前端页面的真实 Algolia 请求（从 sniff-yc.ts 嗅探得到）
 *
 * 筛选条件：
 *   industries:"Consumer Electronics"
 *   batch 在 S24 及之后（S24, F24, W25, S25...）
 */
import { log } from '../lib/logger';
import type { RawStartupItem, ScrapeResult } from '../lib/types';

// 认证信息直接放在 URL query string 里（与真实页面一致）
const ENDPOINT =
  'https://45bwzj1sgc-dsn.algolia.net/1/indexes/*/queries' +
  '?x-algolia-agent=Algolia%20for%20JavaScript%20(3.35.1)%3B%20Browser%3B%20JS%20Helper%20(3.16.1)' +
  '&x-algolia-application-id=45BWZJ1SGC' +
  '&x-algolia-api-key=NzllNTY5MzJiZGM2OTY2ZTQwMDEzOTNhYWZiZGRjODlhYzVkNjBmOGRjNzJiMWM4ZTU0ZDlhYTZjOTJiMjlhMWFuYWx5dGljc1RhZ3M9eWNkYyZyZXN0cmljdEluZGljZXM9WUNDb21wYW55X3Byb2R1Y3Rpb24lMkNZQ0NvbXBhbnlfQnlfTGF1bmNoX0RhdGVfcHJvZHVjdGlvbiZ0YWdGaWx0ZXJzPSU1QiUyMnljZGNfcHVibGljJTIyJTVE';

// batch 白名单：S24 及之后（对应真实字段 "Summer 2024" 等）
// 格式为 "Season YYYY"，例如 "Summer 2024", "Winter 2025"
function isEligibleBatch(batch: string): boolean {
  if (!batch) return false;
  const m = batch.match(/^(Summer|Winter|Fall|Spring)\s+(\d{4})$/i);
  if (!m) return false;
  const year = parseInt(m[2], 10);
  const season = m[1].toLowerCase();
  // 等于 2024 Summer 之后（含）：2024年Summer/Fall/Winter，2025年全部，2026年全部...
  if (year > 2024) return true;
  if (year === 2024 && (season === 'summer' || season === 'fall' || season === 'winter')) return true;
  return false;
}

export async function scrapeYCombinator(maxItems = 100): Promise<ScrapeResult<RawStartupItem>> {
  const t0 = Date.now();
  const result: ScrapeResult<RawStartupItem> = {
    source: 'Y Combinator',
    ok: false,
    items: [],
    errors: [],
    durationMs: 0,
  };

  try {
    log.info('yc', 'querying Algolia for Consumer Electronics companies...');

    // 完全复制真实页面第 2 个请求的 body 格式（URL-encoded params）
    const body = {
      requests: [
        {
          indexName: 'YCCompany_production',
          params: new URLSearchParams({
            facetFilters: JSON.stringify([['industries:Consumer Electronics']]),
            facets: JSON.stringify(['batch', 'industries', 'regions']),
            hitsPerPage: '200',  // 拉取全部，在客户端过滤
            maxValuesPerFacet: '1000',
            page: '0',
            query: '',
            tagFilters: '',
          }).toString(),
        },
      ],
    };

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Algolia HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const json = (await res.json()) as { results?: Array<{ hits?: YCHit[]; nbHits?: number }> };
    const allHits = json.results?.[0]?.hits ?? [];
    log.info('yc', `received ${allHits.length} total hits (nbHits=${json.results?.[0]?.nbHits})`);

    // 在客户端按 batch 过滤（S24 及之后）
    // 在客户端按 batch 过滤（S24 及之后）
    const hits = allHits.filter((h) => isEligibleBatch(h.batch || '')).slice(0, maxItems);
    log.info('yc', `after batch filter: ${hits.length} companies`);

    for (const hit of hits) {
      try {
        const item: RawStartupItem = {
          id: `yc-${hit.slug || hit.objectID}`,
          source: 'Y Combinator',
          name: hit.name || 'Unknown',
          name_zh: hit.name || 'Unknown',
          intro: hit.one_liner || hit.long_description?.slice(0, 240) || '',
          intro_zh: [hit.one_liner || hit.long_description?.slice(0, 240) || ''],
          founders: (hit.founders_names || []).join(', ') || 'Unknown',
          team_size: hit.team_size ? String(hit.team_size) : '',
          location: (() => {
            const raw = hit.all_locations || (hit.regions || []).join(', ') || 'Unknown';
            // Keep only first (city) and last (country) parts, drop middle region/state
            const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
            if (parts.length <= 2) return parts.join(', ');
            return parts[0] + ', ' + parts[parts.length - 1];
          })(),
          batch: hit.batch || '',
          url: hit.website || `https://www.ycombinator.com/companies/${hit.slug || ''}`,
          scrapedAt: new Date().toISOString(),
        };
        result.items.push(item);
      } catch (err) {
        result.errors.push(`hit parse: ${err instanceof Error ? err.message : err}`);
      }
    }

    result.ok = result.items.length > 0;
    log.ok('yc', `extracted ${result.items.length} startups`);
  } catch (err) {
    log.err('yc', 'scrape failed', err);
    result.errors.push(err instanceof Error ? err.message : String(err));
  }

  result.durationMs = Date.now() - t0;
  return result;
}

interface YCHit {
  objectID: string;
  name?: string;
  slug?: string;
  one_liner?: string;
  long_description?: string;
  website?: string;
  batch?: string;
  industries?: string[];
  regions?: string[];
  all_locations?: string;
  founders_names?: string[];
  team_size?: number;
}