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
import { translateCrowdNames, generateCrowdSummaries } from './lib/translate';
import { scrapeCrowdSupply } from './sources/crowdsupply';
import { scrapeKickstarter } from './sources/kickstarter';
import { scrapeIndiegogo } from './sources/indiegogo';
import { scrapeMakuake } from './sources/makuake';
import { scrapeGizchina } from './sources/gizchina';
import { scrapeTechCrunch } from './sources/techcrunch';
import { scrapeVentureburn } from './sources/ventureburn';
import { scrapeTheVerge } from './sources/theverge';
import { scrapeYCombinator } from './sources/ycombinator';
import { scrapeNextbanker } from './sources/nextbanker';
import type { ScrapeResult } from './lib/types';

type Runner = () => Promise<ScrapeResult<any>>;

// 注册表：name → (kind, runner)
const REGISTRY: Record<string, { kind: 'crowdfunding' | 'news' | 'startups' | 'investments'; run: Runner }> = {
  crowdsupply: { kind: 'crowdfunding',  run: () => scrapeCrowdSupply(100) },
  kickstarter: { kind: 'crowdfunding',  run: () => scrapeKickstarter(30) },
  indiegogo:   { kind: 'crowdfunding',  run: () => scrapeIndiegogo(30) },
  makuake:     { kind: 'crowdfunding',  run: () => scrapeMakuake(30) },
  gizchina:    { kind: 'news',          run: () => scrapeGizchina(50) },
  techcrunch:  { kind: 'news',          run: () => scrapeTechCrunch(30) },
  ventureburn: { kind: 'news',          run: () => scrapeVentureburn(30) },
  theverge:    { kind: 'news',          run: () => scrapeTheVerge(30) },
  ycombinator: { kind: 'startups',      run: () => scrapeYCombinator(200) },
  nextbanker:  { kind: 'investments',   run: () => scrapeNextbanker(96) },
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
  const byKind: Record<string, any[]> = { crowdfunding: [], news: [], startups: [], investments: [] };
  for (const { kind, result } of results) {
    byKind[kind].push(...result.items);
  }

  // AI 翻译：翻译众筹产品名称 + 生成中文摘要
  if (byKind.crowdfunding.length > 0) {
    log.info('translate', 'translating crowdfunding product names...');
    await translateCrowdNames(byKind.crowdfunding);
    log.info('translate', 'generating crowdfunding AI summaries...');
    await generateCrowdSummaries(byKind.crowdfunding);
  }

  // 写盘（即使本次某 kind 无新数据也调用 saveSnapshot，触发合并保留旧数据）
  for (const kind of ['crowdfunding', 'news', 'startups', 'investments'] as const) {
    await saveSnapshot(kind, byKind[kind]);
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
  // 改为：只要有至少一个成功就退出码 0，避免部分失败阻断整个流程
  const successCount = results.filter((r) => r.result.ok).length;
  const failCount = results.filter((r) => !r.result.ok).length;
  if (failCount > 0) {
    log.warn('main', `${failCount} scraper(s) failed, but ${successCount} succeeded - data saved`);
  }
  process.exit(successCount > 0 ? 0 : 1);
}

main().catch((err) => {
  log.err('main', 'fatal', err);
  process.exit(2);
});