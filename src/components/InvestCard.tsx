import React from 'react';
import { Clock, Cpu, TrendingUp, Users, BarChart2, Banknote } from 'lucide-react';
import { InvestItem } from '../types';

interface Props {
  item: InvestItem;
  key?: React.Key;
}

export function InvestCard({ item }: Props) {
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
      <div className="p-4 flex-grow flex flex-col gap-3">
        {/* 头部区域 */}
        <div>
          {/* 序号 + 融资状态 + 分类标签 + 时间 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
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
            <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px] shrink-0 ml-2">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{item.daysAgo === 0 ? '今日更新' : `${item.daysAgo}天前`}</span>
            </div>
          </div>

          {/* 项目名称 */}
          <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-700 transition-colors">
            {item.name}
          </h3>
          {/* 标语 */}
          {item.tagline && (
            <p className="text-[12px] text-emerald-600 font-medium mt-0.5 leading-snug">{item.tagline}</p>
          )}
        </div>

        {/* 1. 核心技术 */}
        {item.tech && (
          <div className="bg-violet-50/40 border border-violet-100/50 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <Cpu className={`w-3 h-3 ${getCategoryIconColor(item.category)}`} />
              <span className="text-[10px] font-bold text-violet-700">核心技术</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{item.tech}</p>
          </div>
        )}

        {/* 2. 商业&运营 */}
        {(item.business || item.operations) && (
          <div className="bg-amber-50/40 border border-amber-100/50 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-700">商业&运营</span>
            </div>
            {item.business && (
              <p className="text-xs text-slate-600 leading-relaxed">{item.business}</p>
            )}
            {item.operations && (
              <div className="flex gap-2 pt-1 border-t border-amber-100/50">
                <BarChart2 className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-amber-600 font-bold mb-0.5">运营数据</p>
                  <p className="text-xs text-slate-600">{item.operations}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. 团队介绍 */}
        {item.team && (
          <div className="bg-blue-50/40 border border-blue-100/50 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-700">团队介绍</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{item.team}</p>
          </div>
        )}

        {/* 4. 融资情况 */}
        {item.funding && (
          <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <Banknote className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-700">融资情况</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{item.funding}</p>
          </div>
        )}

      </div>
    </div>
  );
}