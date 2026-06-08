/**
 * 快速验证脚本：单独跑一个 source，打印结果
 * 用法: npx tsx scraper/test-run.ts gizchina
 */
import { scrapeGizchina } from './sources/gizchina';
import { scrapeYCombinator } from './sources/ycombinator';
import { scrapeCrowdSupply } from './sources/crowdsupply';
import { scrapeNextbanker } from './sources/nextbanker';

const source = process.argv[2] ?? 'gizchina';

const runners: Record<string, () => Promise<any>> = {
  gizchina: () => scrapeGizchina(5),
  yc: () => scrapeYCombinator(5),
  crowdsupply: () => scrapeCrowdSupply(5),
  nextbanker: () => scrapeNextbanker(5),
};

const fn = runners[source];
if (!fn) {
  console.error(`Unknown source: ${source}. Available: ${Object.keys(runners).join(', ')}`);
  process.exit(1);
}

fn().then((r) => {
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}).catch((e) => { console.error(e); process.exit(2); });