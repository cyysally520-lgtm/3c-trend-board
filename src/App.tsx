import React, { useState, useMemo, useEffect } from 'react';
import { 
  Rocket, 
  Newspaper, 
  Building2, 
  Search, 
  RotateCcw, 
  Sparkles, 
  Calendar, 
  FilterX,
  Languages,
  BadgeAlert
} from 'lucide-react';
import { CROWDFUNDING_DATA, NEWS_DATA, STARTUP_DATA } from './data';
import { CrowdCard } from './components/CrowdCard';
import { NewsCard } from './components/NewsCard';
import { StartupCard } from './components/StartupCard';
import { InvestCard } from './components/InvestCard';
import { motion, AnimatePresence } from 'motion/react';
import { CrowdfundingItem, NewsItem, StartupItem, InvestItem } from './types';

type TabType = 'investments' | 'crowdfunding' | 'news' | 'startups';

export default function App() {
  // Tab control state
  const [currentTab, setCurrentTab] = useState<TabType>('investments');

  // --- LIVE SYSTEM DATABASES ---
  const [crowdfundingData, setCrowdfundingData] = useState<CrowdfundingItem[]>(CROWDFUNDING_DATA);
  const [newsData, setNewsData] = useState<NewsItem[]>(NEWS_DATA);
  const [startupData, setStartupData] = useState<StartupItem[]>(STARTUP_DATA);
  const [investData, setInvestData] = useState<InvestItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('当前就绪');

  // --- INVESTMENTS SEARCH ---
  const [investSearch, setInvestSearch] = useState('');



  // Hydrate data from back-end database
  // NOTE: 每个数据源独立加载，一个失败不影响其他
  const refreshData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    let anyLoaded = false;

    try {
      // 1. 先读 manifest
      let manifest: any = null;
      let date = '';
      try {
        const manifestRes = await fetch('/data/manifest.json');
        if (manifestRes.ok) {
          manifest = await manifestRes.json();
          if (manifest.dates && manifest.dates.length > 0) {
            date = manifest.dates[0];
          }
        }
      } catch (e) {
        console.warn('[Hydration] manifest fetch failed:', e);
      }

      // 2. 独立加载每个数据源（一个失败不影响其他）
      const loadData = async (kind: string, setter: (data: any[]) => void) => {
        if (!date) return false;
        try {
          const res = await fetch(`/data/${date}/${kind}.json`);
          if (!res.ok) {
            console.warn(`[Hydration] ${kind}.json returned ${res.status}`);
            return false;
          }
          const data = await res.json();
          if (Array.isArray(data.items)) {
            setter(data.items);
            return true;
          }
        } catch (e) {
          console.warn(`[Hydration] ${kind}.json load failed:`, e);
        }
        return false;
      };

      // 并行加载，但互不阻塞
      const [cfLoaded, nLoaded, stLoaded] = await Promise.all([
        loadData('crowdfunding', setCrowdfundingData),
        loadData('news', setNewsData),
        loadData('startups', setStartupData),
      ]);

      // 深海掘金项目独立加载（之前就在 try-catch 里）
      const invLoaded = await loadData('investments', setInvestData);

      anyLoaded = cfLoaded || nLoaded || stLoaded || invLoaded;

      // 3. 更新时间戳
      if (anyLoaded && manifest?.updatedAt) {
        const d = new Date(new Date(manifest.updatedAt).getTime() + 8 * 3600000);
        const y = d.getUTCFullYear();
        const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        setLastUpdated(`${y}/${mo}/${day} ${hh}:${mm}`);
      } else if (anyLoaded) {
        setLastUpdated(date);
      }

      // 4. fallback: Express API（只有静态文件全部失败时才走这里）
      if (!anyLoaded) {
        try {
          const res = await fetch('/api/data');
          if (res.ok) {
            const data = await res.json();
            if (data) {
              if (Array.isArray(data.crowdfunding)) setCrowdfundingData(data.crowdfunding);
              if (Array.isArray(data.news)) setNewsData(data.news);
              if (Array.isArray(data.startups)) setStartupData(data.startups);
              setLastUpdated('实时已同步');
            }
          }
        } catch (e) {
          console.warn('[Hydration] API fallback failed:', e);
        }
      }
    } catch (e) {
      console.warn('[Hydration] Server API offline / fallback defaults loaded.', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);



  // --- CROWDFUNDING LIST STATE & FILTERS ---
  const [crowdSearch, setCrowdSearch] = useState('');
  const [crowdCategory, setCrowdCategory] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [crowdSortBy, setCrowdSortBy] = useState('popular');

  // Available unique tags for crowdfunding items
  const crowdCategories = useMemo(() => {
    const list = crowdfundingData.map(item => item.category_tag_zh);
    return Array.from(new Set(list));
  }, [crowdfundingData]);

  // Filter & sort logic for Tab 1
  const filteredCrowds = useMemo(() => {
    let result = [...crowdfundingData];

    if (crowdSearch.trim()) {
      const q = crowdSearch.toLowerCase();
      result = result.filter(
        item => 
          item.name.toLowerCase().includes(q) || 
          item.name_zh.toLowerCase().includes(q) ||
          item.founder.toLowerCase().includes(q)
      );
    }

    if (crowdCategory) {
      result = result.filter(item => item.category_tag_zh === crowdCategory);
    }

    if (selectedPlatforms.length > 0) {
      result = result.filter(item => selectedPlatforms.includes(item.platform));
    }

    // Sort options
    if (crowdSortBy === 'popular') {
      result.sort((a, b) => b.backers - a.backers);
    } else if (crowdSortBy === 'raised') {
      // Simple comparative raised value normalization
      result.sort((a, b) => {
        const valA = a.currency === 'JPY' ? a.raised / 155 : a.raised;
        const valB = b.currency === 'JPY' ? b.raised / 155 : b.raised;
        return valB - valA;
      });
    } else if (crowdSortBy === 'progress') {
      result.sort((a, b) => b.progress_pct - a.progress_pct);
    }

    return result;
  }, [crowdSearch, crowdCategory, selectedPlatforms, crowdSortBy, crowdfundingData]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };

  const resetCrowdFilters = () => {
    setCrowdSearch('');
    setCrowdCategory('');
    setSelectedPlatforms([]);
    setCrowdSortBy('popular');
  };


  // --- TECHNOLOGY NEWS STATE & FILTERS ---
  const [newsSearch, setNewsSearch] = useState('');
  const [newsCategory, setNewsCategory] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const newsCategories = useMemo(() => {
    const list = newsData.map(item => item.category_tag_zh);
    return Array.from(new Set(list));
  }, [newsData]);

  const filteredNews = useMemo(() => {
    let result = [...newsData];

    if (newsSearch.trim()) {
      const q = newsSearch.toLowerCase();
      result = result.filter(
        item => 
          item.title.toLowerCase().includes(q) || 
          item.title_zh.toLowerCase().includes(q) ||
          item.snippet.toLowerCase().includes(q)
      );
    }

    if (newsCategory) {
      result = result.filter(item => item.category_tag_zh === newsCategory);
    }

    if (selectedSources.length > 0) {
      result = result.filter(item => selectedSources.includes(item.source));
    }

    return result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()); // Newest first
  }, [newsSearch, newsCategory, selectedSources, newsData]);

  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source) 
        : [...prev, source]
    );
  };

  const resetNewsFilters = () => {
    setNewsSearch('');
    setNewsCategory('');
    setSelectedSources([]);
  };


  // --- STARTUPS STATE & FILTERS ---
  const [startupSearch, setStartupSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const filteredStartups = useMemo(() => {
    let result = [...startupData];

    if (startupSearch.trim()) {
      const q = startupSearch.toLowerCase();
      result = result.filter(
        item => 
          item.name.toLowerCase().includes(q) || 
          item.name_zh.toLowerCase().includes(q) ||
          item.team_size.toLowerCase().includes(q) ||
          item.intro.toLowerCase().includes(q)
      );
    }

    if (selectedBatch) {
      result = result.filter(item => item.batch === selectedBatch);
    }

    return result;
  }, [startupSearch, selectedBatch, startupData]);

  const resetStartupFilters = () => {
    setStartupSearch('');
    setSelectedBatch('');
  };

  // --- INVESTMENTS FILTER ---
  const filteredInvests = useMemo(() => {
    let result = [...investData];

    if (investSearch.trim()) {
      const q = investSearch.toLowerCase();
      result = result.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          item.tagline.toLowerCase().includes(q) ||
          item.tech.toLowerCase().includes(q) ||
          item.business.toLowerCase().includes(q) ||
          item.team.toLowerCase().includes(q) ||
          item.funding.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [investSearch, investData]);

  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-800 font-sans flex flex-col antialiased relative">
      
      {/* 顶部优雅 Header */}
      <header className="sticky top-0 z-45 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo 和 标题 */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-mono font-black text-xl tracking-wider px-3.5 py-1.5 rounded-xl shadow-xs">
              Aidol
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Aidol 产品趋势看板——实时追踪智能新品众筹、极客电子硬件与 YC/a16z 孵化初创名册
              </h1>
            </div>
          </div>

          {/* 数据状态 */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 shadow-3xs">
            <span className="relative flex h-2 w-2">
              {isLoading ? (
                <span className="animate-spin inline-flex h-2 w-2 rounded-full border border-emerald-500 border-t-transparent"></span>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              )}
            </span>
            <span className="text-slate-500 font-medium text-[10px]">
              更新已完成 · <span className="text-slate-700 font-semibold font-mono">{lastUpdated}</span>
            </span>
          </div>

        </div>
      </header>

      {/* 导航 Tab 菜单 */}
      <nav className="bg-white border-b border-slate-100 shadow-3xs sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto scrollbar-none py-1">
            
            {/* Tab 1: 深海掘金项目 */}
            <button 
              onClick={() => setCurrentTab('investments')}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                currentTab === 'investments' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              深海掘金项目
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
                currentTab === 'investments' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {investData.length}
              </span>
            </button>

            {/* Tab 2: 全球众擎启航 */}
            <button 
              onClick={() => setCurrentTab('crowdfunding')}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                currentTab === 'crowdfunding' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Rocket className="w-4 h-4" />
              全球众擎启航
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
                currentTab === 'crowdfunding' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {crowdfundingData.length}
              </span>
            </button>

            {/* Tab 3: 硅谷前沿浪潮 */}
            <button 
              onClick={() => setCurrentTab('news')}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                currentTab === 'news' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              硅谷前沿浪潮
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
                currentTab === 'news' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {newsData.length}
              </span>
            </button>

            {/* Tab 4: 新锐科技独角 */}
            <button 
              onClick={() => setCurrentTab('startups')}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                currentTab === 'startups' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              新锐科技独角
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
                currentTab === 'startups' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {startupData.length}
              </span>
            </button>

          </div>
        </div>
      </nav>

      {/* 主要渲染区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        
        {/* ===================== TAB 1: 深海掘金项目 ===================== */}
        {currentTab === 'investments' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-base font-semibold text-white">AI 驱动的水下高潜项目线索发现引擎</p>
                  <p className="text-xs text-slate-400 mt-0.5">让天下的洞见都能找到伯乐</p>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">100<span className="text-lg">+</span></div>
                  <div className="text-[10px] text-slate-400 mt-0.5">渠道</div>
                </div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">4,320</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">信源</div>
                </div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">862</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">高潜标的</div>
                </div>
              </div>
            </div>

            {/* 搜索框 */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-4">
              <div className="relative max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={investSearch}
                  onChange={e => setInvestSearch(e.target.value)}
                  placeholder="输入产品名称、技术关键词、团队名称..."
                  className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            {filteredInvests.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredInvests.map(item => (
                  <InvestCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-150 p-12 text-center max-w-lg mx-auto shadow-3xs">
                <Sparkles className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-sm font-semibold text-slate-900">深海掘金项目数据加载中</h3>
                <p className="mt-1 text-xs text-slate-400">数据需要首次运行爬虫后才能显示，请等待每日自动更新。</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ===================== TAB 2: 全球众擎启航 ===================== */}
        {currentTab === 'crowdfunding' && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* 顶栏筛选过滤容器 */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-4 sm:p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* 搜索框 */}
                <div className="relative flex-grow max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input 
                    type="text" 
                    value={crowdSearch}
                    onChange={e => setCrowdSearch(e.target.value)}
                    placeholder="输入众筹产品名称、中文翻译、发起人..." 
                    className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>

                {/* 选项过滤器 */}
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* 分类过滤 */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">分类:</span>
                    <select 
                      value={crowdCategory}
                      onChange={e => setCrowdCategory(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-md text-xs px-2.5 py-1.5 text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
                    >
                      <option value="">全部品类</option>
                      {crowdCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* 排序规则 */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">排序:</span>
                    <select 
                      value={crowdSortBy}
                      onChange={e => setCrowdSortBy(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-md text-xs px-2.5 py-1.5 text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
                    >
                      <option value="popular">热度优先 (按支持数)</option>
                      <option value="raised">筹资额度 (按美元换算)</option>
                      <option value="progress">筹款进度 (%比最高)</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* 平台渠道选项 */}
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">平台渠道:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {['Kickstarter', 'Indiegogo', 'Makuake', 'Crowd Supply'].map(plat => {
                    const isSelected = selectedPlatforms.includes(plat);
                    return (
                      <button
                        key={plat}
                        onClick={() => togglePlatform(plat)}
                        className={`text-xs inline-flex items-center gap-1.5 px-3 py-1 rounded-full border cursor-pointer select-none transition ${
                          isSelected 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold shadow-2xs' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          plat === 'Kickstarter' ? 'bg-[#059669]' :
                          plat === 'Indiegogo' ? 'bg-[#e5195e]' :
                          plat === 'Makuake' ? 'bg-[#f59e0b]' : 'bg-[#f97316]'
                        }`}></span>
                        {plat}
                      </button>
                    );
                  })}
                </div>

                {/* 清空按钮 */}
                {(crowdSearch || crowdCategory || selectedPlatforms.length > 0) && (
                  <button 
                    onClick={resetCrowdFilters}
                    className="text-xs text-slate-400 hover:text-emerald-600 transition flex items-center gap-1 cursor-pointer select-none font-semibold ml-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    清除所有筛选
                  </button>
                )}
              </div>
            </div>

            {/* 列表渲染网格 4 列 (Exactly matching dynamic high count) */}
            {filteredCrowds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCrowds.map(item => (
                  <CrowdCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-150 p-12 text-center max-w-lg mx-auto shadow-3xs">
                <FilterX className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-sm font-semibold text-slate-900">无可显示的众筹商品</h3>
                <p className="mt-1 text-xs text-slate-400">目前没有符合条件的商品，清空搜索检索词或重置品类筛选。</p>
                <button 
                  onClick={resetCrowdFilters}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition"
                >
                  重置筛选重新加载
                </button>
              </div>
            )}
          </motion.div>
        )}


        {/* ===================== TAB 2: 硅谷前沿浪潮 ===================== */}
        {currentTab === 'news' && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* 检索与大图过滤栏 */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-4 sm:p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* 搜索框 */}
                <div className="relative flex-grow max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input 
                    type="text" 
                    value={newsSearch}
                    onChange={e => setNewsSearch(e.target.value)}
                    placeholder="全盘检索英汉标题、要言要点摘要内容..." 
                    className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>

                {/* 右侧选项 */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium font-sans">资讯类型:</span>
                    <select 
                      value={newsCategory}
                      onChange={e => setNewsCategory(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-md text-xs px-2.5 py-1.5 text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
                    >
                      <option value="">全部类型</option>
                      {newsCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 源媒体多选 */}
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">媒体来源:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {['The Verge', 'TechCrunch', 'Gizchina', 'Ventureburn'].map(src => {
                    const isSelected = selectedSources.includes(src);
                    return (
                      <button
                        key={src}
                        onClick={() => toggleSource(src)}
                        className={`text-xs inline-flex items-center gap-1.5 px-3 py-1 rounded-full border cursor-pointer select-none transition ${
                          isSelected 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold shadow-2xs' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          src === 'The Verge' ? 'bg-indigo-500' :
                          src === 'TechCrunch' ? 'bg-emerald-500' :
                          src === 'Gizchina' ? 'bg-cyan-500' : 'bg-red-500'
                        }`}></span>
                        {src}
                      </button>
                    );
                  })}
                </div>

                {/* 清空 */}
                {(newsSearch || newsCategory || selectedSources.length > 0) && (
                  <button 
                    onClick={resetNewsFilters}
                    className="text-xs text-slate-400 hover:text-emerald-600 transition flex items-center gap-1 cursor-pointer select-none font-semibold ml-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    清除所有筛选
                  </button>
                )}
              </div>
            </div>

            {/* 资讯列表渲染 (单列大卡片形式) */}
            {filteredNews.length > 0 ? (
              <div className="space-y-6">
                {filteredNews.map(item => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-150 p-12 text-center max-w-lg mx-auto shadow-3xs">
                <FilterX className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-sm font-semibold text-slate-900">未检索到任何快讯</h3>
                <p className="mt-1 text-xs text-slate-400">目前暂无对应快讯报导，尝试缩减排除或者重置过滤器。</p>
                <button 
                  onClick={resetNewsFilters}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition"
                >
                  重设资讯过滤项
                </button>
              </div>
            )}
          </motion.div>
        )}


        {/* ===================== TAB 3: 新锐科技独角 ===================== */}
        {currentTab === 'startups' && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* 创企筛选过滤栏 */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* 搜索框 */}
                <div className="relative flex-grow max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input 
                    type="text" 
                    value={startupSearch}
                    onChange={e => setStartupSearch(e.target.value)}
                    placeholder="输入创业公司名" 
                    className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>

                {/* YC/a16z 批次限制过滤 */}
                <div className="flex items-center gap-3 font-sans">
                  <span className="text-[11px] text-slate-400 font-medium">批次:</span>
                  <select 
                    value={selectedBatch}
                    onChange={e => setSelectedBatch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md text-xs px-2.5 py-1.5 text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
                  >
                    <option value="">全部批次</option>
                    <option value="Spring 2026">S26（Spring 2026）</option>
                    <option value="Winter 2026">W26（Winter 2026）</option>
                    <option value="Fall 2025">F25（Fall 2025）</option>
                    <option value="Summer 2025">S25（Summer 2025）</option>
                    <option value="Winter 2025">W25（Winter 2025）</option>
                    <option value="Fall 2024">F24（Fall 2024）</option>
                    <option value="Summer 2024">S24（Summer 2024）</option>
                    <option value="Active">a16z Active（投后活跃）</option>
                  </select>

                  {/* 重设 */}
                  {(startupSearch || selectedBatch) && (
                    <button 
                      onClick={resetStartupFilters}
                      className="text-xs text-slate-400 hover:text-emerald-600 transition flex items-center gap-1 cursor-pointer select-none font-semibold ml-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      重置
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* 孵化器初创创企 3 列极速网格 */}
            {filteredStartups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStartups.map(item => (
                  <StartupCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-150 p-12 text-center max-w-lg mx-auto shadow-3xs">
                <FilterX className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-sm font-semibold text-slate-900">无可检索展示的孵化计划</h3>
                <p className="mt-1 text-xs text-slate-400">目前暂无符合相应学届批次的 YC/a16z 创始名单，请换关键词重试。</p>
                <button 
                  onClick={resetStartupFilters}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition"
                >
                  清空筛选重新罗列
                </button>
              </div>
            )}
          </motion.div>
        )}

      </main>

      {/* 底部 Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <p className="font-semibold text-slate-600 tracking-wider font-mono">
            3C TREND ACQUISITION SYSTEM © 2026
          </p>
          <p className="max-w-md mx-auto leading-relaxed">
            数据采集自全球核心开源接口与孵化名录，专为极客提供精巧视觉。
            本平台全面使用 React 19 + Tailwind v4 架构打造而成。
          </p>
          <div className="flex items-center justify-center gap-3 text-emerald-600 font-semibold mt-1 select-none">
            <a href="https://www.kickstarter.com" target="_blank" rel="noreferrer" className="hover:underline">Kickstarter</a>
            <span>•</span>
            <a href="https://www.indiegogo.com" target="_blank" rel="noreferrer" className="hover:underline">Indiegogo</a>
            <span>•</span>
            <a href="https://www.makuake.com" target="_blank" rel="noreferrer" className="hover:underline">Makuake</a>
            <span>•</span>
            <a href="https://www.ycombinator.com" target="_blank" rel="noreferrer" className="hover:underline">Y Combinator</a>
            <span>•</span>
            <a href="https://a16z.com" target="_blank" rel="noreferrer" className="hover:underline">a16z Portfolio</a>
          </div>
        </div>
      </footer>



    </div>
  );
}
