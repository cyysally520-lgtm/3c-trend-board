/**
 * 爬虫总调度入口
 * 用法：
 *   npx tsx scraper/index.ts           # 跑所有
 *   npx tsx scraper/index.ts crowdsupply gizchina  # 仅跑指定的
 *
 * 流程：
 *   1. 并行（带限速）跑所有 source
 *   2. 按 kind 聚合（crowdfunding / news / startups）
 *   3. 按日期写盘
 *   4. 更新 manifest
 *   5. 清理 30 天前历史
 */
import pLimit from 'p-limit';
import { log } from './lib/logger';
import { saveSnapshot, updateManifest, pruneOldSnapshots } from './lib/storage';
import { closeBrowser } from './lib/browser';
import { scrapeCrowdSupply } from './sources/crowdsupply';
import { scrapeGizchina } from './sources/gizchina';
import { scrapeYCombinator } from './sources/ycombinator';
import type { ScrapeResult } from './lib/types';

type Runner = () => Promise<ScrapeResult<any>>;

// 注册表：name → (kind, runner)
const REGISTRY: Record<string, { kind: 'crowdfunding' | 'news' | 'startups'; run: Runner }> = {
  crowdsupply: { kind: 'crowdfunding', run: () => scrapeCrowdSupply(100) },  // 首页全量（约20-30个活跃项目）
  gizchina:    { kind: 'news',         run: () => scrapeGizchina(50) },      // 最新50条资讯
  ycombinator: { kind: 'startups',     run: () => scrapeYCombinator(200) },  // YC全量Consumer Electronics
};

async function main() {
  const argv = process.argv.slice(2).map((s) => s.toLowerCase());
  const selected = argv.length > 0 ? argv : Object.keys(REGISTRY);
  log.info('main', `will scrape: ${selected.join(', ')}`);

  const limit = pLimit(2); // 同时最多 2 个 source 在跑，避免本机 / GH runner 过载

  const results: Array<{ name: string; kind: string; result: ScrapeResult<any> }> = [];
  await Promise.all(
    selected.map((name) =>
      limit(async () => {
        const reg = REGISTRY[name];
        if (!reg) {
          log.warn('main', `unknown source: ${name} (available: ${Object.keys(REGISTRY).join(', ')})`);
          return;
        }
        const r = await reg.run();
        results.push({ name, kind: reg.kind, result: r });
      }),
    ),
  );

  // 按 kind 聚合（同一 kind 多 source 的可能合并，目前一对一）
  const byKind: Record<string, any[]> = { crowdfunding: [], news: [], startups: [] };
  for (const { kind, result } of results) {
    byKind[kind].push(...result.items);
  }

  // 写盘
  for (const kind of ['crowdfunding', 'news', 'startups'] as const) {
    if (byKind[kind].length > 0) {
      await saveSnapshot(kind, byKind[kind]);
    } else {
      log.warn('main', `no data for kind=${kind}, skip writing`);
    }
  }

  await updateManifest();
  await pruneOldSnapshots(30);

  await closeBrowser();

  // 打印总结
  log.ok('main', '=== Scrape Summary ===');
  for (const { name, result } of results) {
    log.ok('main', `  ${name}: ${result.ok ? 'OK' : 'FAIL'}, items=${result.items.length}, errors=${result.errors.length}, ${result.durationMs}ms`);
  }

  // 任意一个完全失败就以 1 退出（CI 友好）
  const anyFail = results.some((r) => !r.result.ok);
  process.exit(anyFail ? 1 : 0);
}

main().catch((err) => {
  log.err('main', 'fatal', err);
  process.exit(2);
});