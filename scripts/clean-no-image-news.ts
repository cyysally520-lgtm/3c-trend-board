/**
 * 一次性清洗脚本：扫 data/ 下所有 news.json，删除 image 为空的条目
 * 用法：npx tsx scripts/clean-no-image-news.ts
 *
 * 跑完会原地修改：
 *   - data/latest/news.json
 *   - data/YYYY-MM-DD/news.json (每个日期归档)
 * 并打印每个文件清洗前后的条数对比。
 */
import { promises as fs } from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'data');

async function cleanFile(filePath: string): Promise<{ before: number; after: number } | null> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
  let obj: any;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(obj?.items)) return null;

  const before = obj.items.length;
  obj.items = obj.items.filter((it: any) => it && it.image && String(it.image).trim());
  obj.count = obj.items.length;
  const after = obj.items.length;

  if (after === before) return { before, after };

  await fs.writeFile(filePath, JSON.stringify(obj, null, 2), 'utf8');
  return { before, after };
}

async function main() {
  const targets: string[] = [path.join(ROOT, 'latest', 'news.json')];

  // 收集所有日期目录
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name)) {
      targets.push(path.join(ROOT, e.name, 'news.json'));
    }
  }

  console.log(`scanning ${targets.length} news.json files...\n`);
  let totalBefore = 0, totalAfter = 0, changedFiles = 0;

  for (const t of targets) {
    const r = await cleanFile(t);
    if (!r) {
      console.log(`  [skip] ${path.relative(ROOT, t)}`);
      continue;
    }
    const dropped = r.before - r.after;
    const rel = path.relative(ROOT, t);
    if (dropped > 0) {
      console.log(`  [clean] ${rel}: ${r.before} → ${r.after} (-${dropped})`);
      changedFiles++;
    } else {
      console.log(`  [ok]    ${rel}: ${r.before} (no change)`);
    }
    totalBefore += r.before;
    totalAfter += r.after;
  }

  console.log(`\nsummary: ${totalBefore} → ${totalAfter} (-${totalBefore - totalAfter}) across ${changedFiles} file(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
