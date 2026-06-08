/**
 * 爬虫数据模型 - 与前端 src/types.ts 对应但更宽松
 * 爬虫输出原始数据，由 normalizer 转成前端类型
 */

export interface RawCrowdfundingItem {
  id: string;                // 平台前缀 + 项目 slug，如 "ks-birdie-pro"
  platform: 'Kickstarter' | 'Indiegogo' | 'Makuake' | 'Crowd Supply';
  image: string;
  name: string;
  name_zh?: string;
  founder: string;
  location: string;
  raised: number;            // 数值（已清洗）
  currency: string;          // 三字母代码 USD/JPY/EUR
  currencySymbol: string;
  progress_pct: number;
  backers: number;
  price: string;             // 保留原始字符串，如 "$199"
  campaign_url: string;
  category_tag_zh: string;
  summary_zh: string[];
  scrapedAt: string;         // ISO 时间戳
}

export interface RawNewsItem {
  id: string;                // source 前缀 + url hash
  source: 'Ventureburn' | 'The Verge' | 'Gizchina' | 'TechCrunch';
  image: string;
  title: string;
  title_zh?: string;
  publishedAt: string;       // ISO 时间戳（绝对时间，前端再算 hoursAgo）
  snippet: string;
  snippet_zh: string[];
  url: string;
  category_tag_zh: string;
  scrapedAt: string;
}

export interface RawStartupItem {
  id: string;                // source 前缀 + slug
  source: 'Y Combinator' | 'a16z';
  name: string;
  name_zh?: string;
  intro: string;
  intro_zh: string[];
  founders: string;
  location: string;
  batch: string;             // 如 "S24" / "W25"
  url: string;
  scrapedAt: string;
}

export interface RawInvestItem {
  id: string;
  rank: number;                 // 排序序号
  name: string;                 // 项目名称
  tagline: string;              // 简短标签，如 "KS $400K+"
  category: string;             // 子分类，如 "AI眼镜"
  tech: string;                 // 技术描述
  business: string;             // 商业描�
  team: string;                 // 团队信息
  operations: string;           // 运营数据
  funding: string;              // 融资状态
  daysAgo: number;              // 几天前发布
  source_url: string;           // 原始页面链接
  scrapedAt: string;
}

export interface ScrapeResult<T> {
  source: string;
  ok: boolean;
  items: T[];
  errors: string[];
  durationMs: number;
}