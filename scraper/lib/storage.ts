/**
 * 数据存储层：按日期归档 + manifest 索引
 *
 * 目录结构:
 *   data/
 *     manifest.json                          ← 索引：列出所有可用日期
 *     latest/                                ← 软链作用：最新一次数据
 *       crowdfunding.json
 *       news.json
 *       startups.json
 *     2026-06-08/                            ← 按日期归档（最多保留 30 天）
 *       crowdfunding.json
 *       news.json
 *       startups.json
 */
import { promises as fs } from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { log } from './logger';

const ROOT = path.resolve(process.cwd(), 'data');
const RETENTION_DAYS = 30;

export type DataKind = 'crowdfunding' | 'news' | 'startups' | 'investments';

export interface Manifest {
  updatedAt: string;
  dates: string[];      // 倒序：最新在前
  kinds: DataKind[];
  counts: Record<string, Partial<Record<DataKind, number>>>;
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function saveSnapshot<T>(kind: DataKind, items: T[], date?: string): Promise<void> {
  const d = date ?? dayjs().format('YYYY-MM-DD');
  const dayDir = path.join(ROOT, d);
  const latestDir = path.join(ROOT, 'latest');
  await ensureDir(dayDir);
  await ensureDir(latestDir);

  const payload = JSON.stringify({ date: d, kind, count: items.length, items }, null, 2);
  await fs.writeFile(path.join(dayDir, `${kind}.json`), payload, 'utf8');
  await fs.writeFile(path.join(latestDir, `${kind}.json`), payload, 'utf8');

  log.ok('storage', `saved ${kind} (${items.length} items) → ${d}`);
}

export async function updateManifest(): Promise<Manifest> {
  await ensureDir(ROOT);
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  const dateDirs = entries
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .sort()
    .reverse();

  const counts: Manifest['counts'] = {};
  for (const d of dateDirs) {
    counts[d] = {};
    for (const kind of ['crowdfunding', 'news', 'startups', 'investments'] as DataKind[]) {
      const f = path.join(ROOT, d, `${kind}.json`);
      try {
        const raw = await fs.readFile(f, 'utf8');
        const obj = JSON.parse(raw);
        counts[d][kind] = obj.count ?? (Array.isArray(obj.items) ? obj.items.length : 0);
      } catch {
        // 当天该类没有
      }
    }
  }

  const manifest: Manifest = {
    updatedAt: new Date().toISOString(),
    dates: dateDirs,
    kinds: ['crowdfunding', 'news', 'startups', 'investments'],
    counts,
  };
  await fs.writeFile(path.join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  log.ok('storage', `manifest updated (${dateDirs.length} dates)`);
  return manifest;
}

/**
 * 清理超过 retentionDays 的旧数据目录
 */
export async function pruneOldSnapshots(retentionDays = RETENTION_DAYS): Promise<void> {
  await ensureDir(ROOT);
  const cutoff = dayjs().subtract(retentionDays, 'day');
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory() || !/^\d{4}-\d{2}-\d{2}$/.test(e.name)) continue;
    if (dayjs(e.name).isBefore(cutoff)) {
      await fs.rm(path.join(ROOT, e.name), { recursive: true, force: true });
      log.info('storage', `pruned old snapshot: ${e.name}`);
    }
  }
}

export function dataRoot() {
  return ROOT;
}