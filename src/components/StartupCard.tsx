import React, { useState } from 'react';
import { Sparkles, Trophy, MapPin, Users, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';
import { StartupItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface StartupCardProps {
  item: StartupItem;
}

export const StartupCard: React.FC<StartupCardProps> = ({ item }) => {
  const [showAiAnalysis, setShowAiAnalysis] = useState(true);

  return (
    <div 
      id={`startup-card-${item.id}`}
      className="group bg-white rounded-xl border border-slate-100 p-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-300"
    >
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-[15px] font-bold text-[#1e293b] group-hover:text-emerald-700 transition-colors">
                {item.name}
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono border ${
                item.source === 'a16z'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-orange-100 text-orange-800 border-orange-200'
              }`}>
                {item.source === 'a16z' ? `a16z ${item.batch}` : `YC ${item.batch}`}
              </span>
            </div>
          </div>

          {/* Source classic badge */}
          <div className={`font-mono font-black text-[11px] select-none px-2 py-1 rounded shadow-3xs ${
            item.source === 'a16z' ? 'bg-sky-950 text-[#38bdf8]' : 'bg-[#ff6600] text-white'
          }`} title={item.source === 'a16z' ? 'Andreessen Horowitz Portfolio' : 'Y Combinator Incubation'}>
            {item.source === 'a16z' ? 'a16z' : 'YC'}
          </div>
        </div>

        {/* English vision intro */}
        <p className="text-xs text-slate-400 italic line-clamp-3 leading-relaxed border-l-2 border-slate-200 pl-3">
          "{item.intro}"
        </p>

        {/* AI Insight deep analysis */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setShowAiAnalysis(!showAiAnalysis)}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-700 bg-emerald-50/65 hover:bg-emerald-100/50 px-2.5 py-1.5 rounded-lg transition select-none cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-[#10b981]" />
              AI 独角兽指数潜质分析
            </button>
            <button 
              onClick={() => setShowAiAnalysis(!showAiAnalysis)}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              {showAiAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showAiAnalysis && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-gradient-to-br from-emerald-50/40 to-slate-50 border border-emerald-100/50 p-3.5 rounded-lg space-y-1.5 mt-1">
                  {item.intro_zh.map((bullet, idx) => (
                    <div key={idx} className="text-xs text-slate-600 leading-normal flex items-start gap-1.5">
                      <span className="text-[#10b981] font-extrabold select-none mt-0.5 shrink-0">•</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Founders and location details rows */}
        <div className="pt-3 grid grid-cols-2 gap-4 text-[11px] border-t border-slate-100/85">
          <div className="space-y-0.5">
            <span className="text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              团队人数
            </span>
            <p className="font-semibold text-slate-700 truncate" title={item.team_size || item.founders}>
              {item.team_size || item.founders || '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              注册地 / 国家城市
            </span>
            <p className="font-semibold text-slate-700 truncate" title={item.location}>
              {item.location}
            </p>
          </div>
        </div>
      </div>

      {/* Footer link to company profiles */}
      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
        {item.source !== 'a16z' && (
          <a 
            href={`https://www.ycombinator.com/companies/${item.id.replace('yc-', '')}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer text-orange-600 hover:text-orange-700"
          >
            YC 产品介绍
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}
        <a 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`text-xs font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer ${
            item.source === 'a16z' ? 'text-sky-600 hover:text-sky-700' : 'text-orange-600 hover:text-orange-700'
          }`}
        >
          {item.source === 'a16z' ? '查看 a16z 官网详情' : '公司官网'}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
