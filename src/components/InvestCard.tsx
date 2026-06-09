import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Tag, Cpu, TrendingUp, Users, BarChart2, Banknote, ExternalLink, Sparkles } from 'lucide-react';
import { InvestItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  item: InvestItem;
}

export function InvestCard({ item }: Props) {
  const [expanded, setExpanded] = useState(false);

  // 分类颜色映射
  const getCategoryStyle = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('ai') || cat.includes('人工智能')) return 'bg-violet-100 text-violet-700 border-violet-200';
    if (cat.includes('hardware') || cat.includes('硬件')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (cat.includes('robot') || cat.includes('机器人')) return 'bg-sky-100 text-sky-700 border-sky-200';
    if (cat.includes('health') || cat.includes('医疗')) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (cat.includes('energy') || cat.includes('能源')) return 'bg-lime-100 text-lime-700 border-lime-200';
    if (cat.includes('fintech') || cat.includes('金融')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (cat.includes('bio') || cat.includes('生物')) return 'bg-teal-100 text-teal-700 border-teal-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  // 融资状态标签颜色
  const getFundingStyle = (funding: string) => {
    if (funding.includes('未融资')) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (funding.includes('天使')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (funding.includes('A轮')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (funding.includes('B轮')) return 'bg-red-100 text-red-700 border-red-200';
    if (funding.includes('C轮') || funding.includes('D轮')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (funding.includes('IPO') || funding.includes('上市')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  // 分类图标颜色
  const getCategoryIconColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('ai') || cat.includes('人工智能')) return 'text-violet-500';
    if (cat.includes('hardware') || cat.includes('硬件')) return 'text-amber-500';
    if (cat.includes('robot') || cat.includes('机器人')) return 'text-sky-500';
    if (cat.includes('health') || cat.includes('医疗')) return 'text-rose-500';
    return 'text-emerald-500';
  };

  return (
    <div className="group bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col">
      {/* 顶部彩色分类条 */}
      <div className="h-[3px] bg-gradient-to-r from-violet-500 via-emerald-500 to-amber-500 w-full shrink-0"></div>

      {/* 卡片内容 */}
      <div className="p-4 flex-grow flex flex-col justify-between gap-3">
        {/* 头部区域 */}
        <div>
          {/* 序号 + 融资状态 + 分类标签 */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
              #{item.rank}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getFundingStyle(item.funding)}`}>
              {item.funding.split('（')[0].slice(0, 10)}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryStyle(item.category)}`}>
              {item.category}
            </span>
          </div>

          {/* 项目名称 - 黑色粗体 */}
          <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-700 transition-colors">
            {item.name}
          </h3>
          {/* 标语 + 融资信息 - 绿色小字 */}
          {item.tagline && (
            <p className="text-[12px] text-emerald-600 font-medium mt-0.5 leading-snug">{item.tagline}</p>
          )}
          {item.funding && (
            <p className="text-[11px] text-emerald-500 font-mono font-semibold mt-0.5">{item.funding}</p>
          )}
        </div>

        {/* 技术与商业摘要 */}
        {item.tech && (
          <div className="bg-violet-50/40 border border-violet-100/50 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <Cpu className={`w-3 h-3 ${getCategoryIconColor(item.category)}`} />
              <span className="text-[10px] font-bold text-violet-700">核心技术</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{item.tech}</p>
          </div>
        )}

        {item.business && (
          <div className="bg-amber-50/40 border border-amber-100/50 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-700">商业模式</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{item.business}</p>
          </div>
        )}

        {/* 时间标签 */}
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{item.daysAgo === 0 ? '今日更新' : `${item.daysAgo}天前`}</span>
        </div>

        {/* 展开/收起详情 */}
        <div className="border-t border-slate-100 pt-2 space-y-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50/40 text-emerald-800 hover:bg-emerald-50 font-bold transition cursor-pointer select-none"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
              展开详情
            </span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="bg-gradient-to-br from-emerald-50/30 to-teal-50/10 border border-emerald-100/50 p-3 rounded-lg space-y-3">
                  {item.team && (
                    <div className="flex gap-2">
                      <Users className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-blue-600 font-bold mb-0.5">团队</p>
                        <p className="text-xs text-slate-600">{item.team}</p>
                      </div>
                    </div>
                  )}
                  {item.operations && (
                    <div className="flex gap-2">
                      <BarChart2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-amber-600 font-bold mb-0.5">运营数据</p>
                        <p className="text-xs text-slate-600">{item.operations}</p>
                      </div>
                    </div>
                  )}
                  {item.funding && (
                    <div className="flex gap-2">
                      <Banknote className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-emerald-600 font-bold mb-0.5">融资状态</p>
                        <p className="text-xs text-slate-600">{item.funding}</p>
                      </div>
                    </div>
                  )}
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition cursor-pointer"
                  >
                    查看原始来源
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}