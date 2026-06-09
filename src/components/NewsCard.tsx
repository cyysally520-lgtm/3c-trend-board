import React, { useState, useMemo } from 'react';
import { Calendar, Sparkles, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { NewsItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface NewsCardProps {
  item: NewsItem;
}

/** 根据 publishedAt 实时计算相对时间描述 */
function getRelativeTime(publishedAt: string): string {
  const now = Date.now();
  const then = new Date(publishedAt).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return '刚刚';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}天前`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}个月前`;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item }) => {
  const [showAiSummary, setShowAiSummary] = useState(true);
  const relativeTime = useMemo(() => getRelativeTime(item.publishedAt), [item.publishedAt]);

  const getSourceStyle = (source: string) => {
    switch (source) {
      case 'The Verge':
        return 'bg-indigo-600 text-white';
      case 'TechCrunch':
        return 'bg-emerald-600 text-white';
      case 'Gizchina':
        return 'bg-cyan-600 text-white';
      case 'Ventureburn':
        return 'bg-red-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <div 
      id={`news-card-${item.id}`}
      className="group bg-white rounded-xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 p-4 sm:p-5 flex flex-col lg:flex-row gap-5"
    >
      {/* Media column */}
      <div className="w-full lg:w-64 shrink-0 relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-50">
        <img 
          src={item.image} 
          alt={item.title} 
          className="object-cover w-full h-full group-hover:scale-103 transition-transform duration-500" 
          referrerPolicy="no-referrer"
        />
        
        {/* Source Badge */}
        <div className="absolute top-3 left-3 select-none">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wide uppercase shadow-sm ${getSourceStyle(item.source)}`}>
            {item.source}
          </span>
        </div>

        {/* Category Tag Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/65 backdrop-blur-xs text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-xs">
          {item.category_tag_zh}
        </div>
      </div>

      {/* Content description column */}
      <div className="flex-grow flex flex-col justify-between gap-3">
        <div className="space-y-2">
          
          {/* Time block */}
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>发布于 {relativeTime}</span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 select-none group-hover:text-emerald-700 transition-colors">
            {item.title_zh}
          </h3>

          {/* Original snippet quote */}
          <p className="text-xs text-slate-400 italic line-clamp-2 leading-relaxed bg-slate-50/50 p-2 rounded-md border-l border-slate-200">
            "{item.snippet}"
          </p>
        </div>

        {/* AI Insight bullets list with solid emerald layout */}
        <div className="space-y-2 pt-2 border-t border-slate-50">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setShowAiSummary(!showAiSummary)}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/50 px-2.5 py-1.5 rounded-lg transition select-none cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
              AI 智能摘要提炼
            </button>
            <button 
              onClick={() => setShowAiSummary(!showAiSummary)}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              {showAiSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showAiSummary && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/20 border-l-2 border-[#10b981] p-3.5 rounded-r-lg space-y-1.5">
                  {item.snippet_zh.map((bullet, idx) => (
                    <div key={idx} className="text-xs text-slate-600 leading-normal flex items-start gap-2">
                      <span className="text-emerald-500 font-extrabold select-none mt-0.5 shrink-0">•</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Campaign external target Link */}
        <div className="flex justify-end pt-1">
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition cursor-pointer"
          >
            去阅读来源原文报道 →
          </a>
        </div>

      </div>
    </div>
  );
};
