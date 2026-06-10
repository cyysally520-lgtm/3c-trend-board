import React from 'react';
import { Clock, Cpu, TrendingUp, Users, Banknote } from 'lucide-react';
import { InvestItem } from '../types';

interface Props {
  item: InvestItem;
  key?: React.Key;
}

export function InvestCard({ item }: Props) {
  return (
    <div className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col">
      {/* 卡片内容 */}
      <div className="p-4 flex-grow flex flex-col gap-3">
        {/* 头部区域 */}
        <div>
          {/* 序号 + 分类 + 融资状态，右上角 时间 */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-slate-400">#{item.rank}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50">
                {item.category}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-slate-200 text-slate-600 bg-slate-50">
                {item.funding.split('（')[0].slice(0, 10)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px] shrink-0 ml-2">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{item.daysAgo === 0 ? '今日更新' : `${item.daysAgo}天前`}</span>
            </div>
          </div>

          {/* 项目名称 */}
          <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-700 transition-colors">
            {item.name}
          </h3>
        </div>

        {/* 1. 技术 */}
        {item.tech && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-violet-500" />
              <span className="text-[10px] font-bold text-violet-600">技术</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed pl-4">{item.tech}</p>
          </div>
        )}

        {/* 2. 商业 / 运营 */}
        {(item.business || item.operations) && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600">商业 / 运营</span>
            </div>
            <div className="pl-4 space-y-0.5">
              {item.business && (
                <p className="text-xs text-slate-700 leading-relaxed">{item.business}</p>
              )}
              {item.operations && (
                <p className="text-xs text-slate-700 leading-relaxed">{item.operations}</p>
              )}
            </div>
          </div>
        )}

        {/* 3. 团队 */}
        {item.team && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600">团队</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed pl-4">{item.team}</p>
          </div>
        )}

        {/* 4. 融资 */}
        {item.funding && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Banknote className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-bold text-red-600">融资</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed pl-4">{item.funding}</p>
          </div>
        )}
      </div>
    </div>
  );
}