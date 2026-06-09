export interface CrowdfundingItem {
  id: number;
  platform: 'Kickstarter' | 'Indiegogo' | 'Makuake' | 'Crowd Supply';
  image: string;
  name: string;
  name_zh: string;
  founder: string;
  location: string;
  raised: number;
  currency: string;
  currencySymbol: string;
  progress_pct: number;
  backers: number;
  price: string;
  campaign_url: string;
  category_tag_zh: string;
  summary_zh: string[];
}

export interface NewsItem {
  id: number;
  source: 'Ventureburn' | 'The Verge' | 'Gizchina' | 'TechCrunch';
  image: string;
  title: string;
  title_zh: string;
  hoursAgo: number; // For relative time simulation
  snippet: string;
  snippet_zh: string[];
  url: string;
  category_tag_zh: string;
}

export interface StartupItem {
  id: number;
  source: 'Y Combinator' | 'a16z';
  name: string;
  name_zh: string;
  intro: string;
  intro_zh: string[];
  founders: string;
  team_size: string;
  location: string;
  batch: string;
  url: string;
}

export interface InvestItem {
  id: string;
  rank: number;
  name: string;
  tagline: string;
  category: string;
  tech: string;
  business: string;
  team: string;
  operations: string;
  funding: string;
  daysAgo: number;
  source_url: string;
  scrapedAt: string;
}
