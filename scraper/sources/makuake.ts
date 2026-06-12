/**
 * Makuake 爬虫 - 精确解析版
 * 页面格式：项目名称￥金额日数达成率%NEW
 */
import { newContext } from '../lib/browser';
import { log } from '../lib/logger';
import type { RawCrowdfundingItem, ScrapeResult } from '../lib/types';

const HOME_URL = 'https://www.makuake.com/discover/tags/8';

// 3C数码关键词
const TECH_KEYWORDS = [
  'ガジェット', 'テクノロジー', '家電', 'スマホ', 'PC', 'イヤホン', 'ヘッドホン',
  '充電', 'バッテリー', 'モニター', 'ディスプレイ', 'カメラ', 'ドローン', 'ロボット',
  'AI', 'Bluetooth', 'Wi-Fi', 'USB', 'プロジェクター', 'スピーカー', 'キーボード',
  'マウス', 'タブレット', 'ノートPC', 'SSD', 'ルーター', 'ケーブル', 'スタンド',
  '電子', 'デジタル', 'スマート', 'ワイヤレス', 'ポータブル',
  '眼鏡', '時計', 'ライト', 'LED', 'センサー', 'キーボード', 'イヤホン',
  'Flip', 'Elfin', 'SABERA', 'Gatebox', 'Dnsys', 'GLIDIC', 'Keychron',
  'gadget', 'tech', 'digital', 'smart', 'wireless', 'portable', 'electric',
  'projector', 'speaker', 'keyboard', 'mouse', 'monitor', 'camera', 'drone',
  'robot', 'charger', 'battery', 'earphone', 'headphone', 'laptop', 'tablet',
  'fan', 'cooler', '数码', '电子', '智能', '无线', '充电',
];

function isTechProject(text: string): boolean {
  const lower = text.toLowerCase();
  return TECH_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

export async function scrapeMakuake(maxItems = 30): Promise<ScrapeResult<RawCrowdfundingItem>> {
  const t0 = Date.now();
  const result: ScrapeResult<RawCrowdfundingItem> = {
    source: 'Makuake',
    ok: false,
    items: [],
    errors: [],
    durationMs: 0,
  };

  const ctx = await newContext();
  const page = await ctx.newPage();

  try {
    log.info('makuake', `loading: ${HOME_URL}`);
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);

    // 滚动加载更多
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(1500);
    }
    await page.waitForTimeout(2000);

    // 提取项目数据（cap 单次抓取上限到 10000，避免 maxItems=Infinity 时溢出）
    const extractCap = Math.min(maxItems * 2, 10000);
    const rawItems = await extractFromPage(page, extractCap);
    log.info('makuake', `extracted ${rawItems.length} raw items`);

    // 3C数码筛选
    const techItems = rawItems.filter(item => isTechProject(item.name));
    log.info('makuake', `filtered to ${techItems.length} tech items`);

    // 映射到标准格式
    result.items = techItems.slice(0, maxItems).map(r => ({
      id: `mk-${r.slug}`,
      platform: 'Makuake' as const,
      image: r.image || '',
      name: r.name,
      name_zh: r.name,
      founder: r.founder || 'Unknown',
      location: r.location || 'Japan',
      raised: r.raised || 0,
      currency: 'JPY',
      currencySymbol: '￥',
      progress_pct: r.progressPct || 0,
      backers: r.backers || 0,
      price: r.price || '',
      campaign_url: r.campaignUrl,
      category_tag_zh: '#科技',
      summary_zh: [],
      scrapedAt: new Date().toISOString(),
    }));

    result.ok = result.items.length > 0;
    log.ok('makuake', `extracted ${result.items.length} items`);
  } catch (err) {
    log.err('makuake', 'scrape failed', err);
    result.errors.push(err instanceof Error ? err.message : String(err));
  } finally {
    await page.close();
    await ctx.close();
  }

  result.durationMs = Date.now() - t0;
  return result;
}

interface RawMakuakeItem {
  name: string;
  campaignUrl: string;
  image: string;
  raised: number;
  backers: number;
  progressPct: number;
  slug: string;
  founder: string;
  location: string;
  price: string;
}

async function extractFromPage(page: import('playwright').Page, maxItems: number): Promise<RawMakuakeItem[]> {
  return page.evaluate((max) => {
    const items: RawMakuakeItem[] = [];
    const seenUrls = new Set<string>();

    // 查找所有项目链接
    const links = Array.from(document.querySelectorAll('a[href*="/project/"]'));

    for (const link of links) {
      if (items.length >= max) break;
      try {
        const href = (link as HTMLAnchorElement).href;
        const cleanUrl = href.split('?')[0].replace(/\/$/, '');
        if (seenUrls.has(cleanUrl)) continue;
        seenUrls.add(cleanUrl);

        const slugMatch = cleanUrl.match(/\/project\/([^/]+)/);
        const slug = slugMatch ? slugMatch[1] : '';
        if (!slug) continue;

        // 获取图片
        const img = link.querySelector('img');
        const image = img ? (img as HTMLImageElement).src : '';

        // 获取完整文本
        const fullText = link.textContent?.trim() || '';
        if (!fullText || fullText.length < 5) continue;

        // 解析文本格式：项目名称￥金额日数达成率%NEW
        // 或：推奨実行者マーク项目名称￥金额日数达成率%NEW

        let text = fullText;

        // 去掉前缀标记
        text = text.replace(/^推奨実行者マーク/, '');
        text = text.replace(/^NEW/, '');
        text = text.replace(/^人気/, '');
        text = text.replace(/^終了間近/, '');
        text = text.replace(/^あとわずか/, '');

        // 提取金额：￥数字（在￥和日/天之间）
        // Makuake格式：项目名称￥金额日数达成率%
        // 例如：￥185,62049日185% → 金额=185,620，日数=49，达成率=185%
        let raised = 0;
        let price = '';
        let days = 0;
        let progressPct = 0;
        
        // 解析文本格式：项目名称￥金额日数达成率%NEW
        // Makuake格式有逗号粘连问题：￥185,62049日185% 
        // → 金额=1,856,204，日数=49，达成率=185%
        
        // 找到最后一个逗号的位置，切分为前后两部分
        const lastCommaIdx = text.lastIndexOf(',');
        if (lastCommaIdx > 0) {
          // 逗号后的部分：例如 "62049日185%NEW"
          const afterComma = text.slice(lastCommaIdx + 1);
          // 匹配：连续数字 + 日（日数1-3位）
          const dayMatch = afterComma.match(/^(\d+)(\d{1,3})日/);
          if (dayMatch) {
            const beforeLast = dayMatch[1];  // 6204
            days = parseInt(dayMatch[2], 10);  // 49
            
            // 逗号前的部分取数字
            const beforeCommaText = text.slice(0, lastCommaIdx);
            const beforeMatch = beforeCommaText.match(/￥([\d,]+)$/);
            if (beforeMatch) {
              const beforeNum = beforeMatch[1].replace(/,/g, '');
              raised = parseInt(beforeNum + beforeLast, 10) || 0;
            }
            
            // 找达成率
            const progressMatch = afterComma.match(/(\d+)%/);
            if (progressMatch) {
              progressPct = parseInt(progressMatch[1], 10) || 0;
            }
            
            if (raised > 0 && raised < 1000000000) {
              price = '￥' + raised.toLocaleString();
            }
          }
        }
        
        // 备用：如果逗号解析失败，尝试简单匹配
        if (raised === 0) {
          const yenMatch = text.match(/￥([\d,]+)/);
          if (yenMatch) {
            const amountStr = yenMatch[1].replace(/,/g, '');
            raised = parseInt(amountStr, 10) || 0;
            if (raised > 0 && raised < 1000000000) {
              price = '￥' + raised.toLocaleString();
            }
          }
          
          const dayMatch = text.match(/(\d+)日/);
          if (dayMatch) {
            days = parseInt(dayMatch[1], 10) || 0;
          }
          
          const pctMatch = text.match(/(\d+)%/);
          if (pctMatch) {
            progressPct = parseInt(pctMatch[1], 10) || 0;
          }
        }

        // 提取支持者数：从页面其他元素查找
        let backers = 0;
        // 在link的父元素或兄弟元素中查找支持者数
        const parent = link.parentElement;
        if (parent) {
          const parentText = parent.textContent || '';
          const supporterMatch = parentText.match(/(\d[\d,]*)\s*人/);
          if (supporterMatch) {
            backers = parseInt(supporterMatch[1].replace(/,/g, ''), 10) || 0;
          }
        }

        // 提取名称：在文本开头，到￥之前
        let name = '';
        const yenIdx = text.indexOf('￥');
        if (yenIdx > 0) {
          name = text.slice(0, yenIdx).trim();
        } else {
          name = text.slice(0, 80).trim();
        }
        // 清理名称
        name = name.replace(/^\d+/, '').trim();
        name = name.replace(/NEW$/, '').trim();
        name = name.replace(/終了間近$/, '').trim();
        name = name.replace(/あとわずか$/, '').trim();
        name = name.replace(/人気$/, '').trim();

        if (name && name.length > 1 && raised > 0) {
          items.push({
            name: name.slice(0, 100),
            campaignUrl: cleanUrl,
            image,
            raised,
            backers,
            progressPct,
            slug,
            founder: '',
            location: '',
            price,
          });
        }
      } catch (e) { /* skip */ }
    }
    return items;
  }, maxItems as any) as Promise<RawMakuakeItem[]>;
}

if (process.argv[1]?.includes('makuake')) {
  scrapeMakuake(20).then(result => {
    console.log('\n=== Makuake Scrape Result ===');
    console.log('OK:', result.ok);
    console.log('Items:', result.items.length);
    console.log('Errors:', result.errors);
    for (const item of result.items) {
      console.log(`  ${item.name.slice(0, 40).padEnd(40)} raised=￥${item.raised.toLocaleString()} backers=${item.backers} progress=${item.progress_pct}% price=${item.price}`);
    }
  });
}