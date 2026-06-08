import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Tag, Cpu, TrendingUp, Users, BarChart2, Banknote, ExternalLink } from 'lucide-react';
import { InvestItem } from '../types';

interface Props {
  item: InvestItem;
}

export function InvestCard({ item }: Props) {
  const [expanded, setExpanded] = useState(false);

  // 融资状态标签颜色
  const fundingColor = item.funding.includes('未融资')
    ? 'bg-slate-100 text-slate-600'
    : item.funding.includes('天使')
      ? 'bg-yellow-50 text-yellow-700'
      : 'bg-emerald-50 text-emerald-700';

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* 头部 */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* 序号 + 名称 */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-slate-400">#{item.rank}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${fundingColor}`}>
                {item.funding.split('（')[0].slice(0, 8)}
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                {item.category}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{item.name}</h3>
            {item.tagline && (
              <p className="text-xs text-emerald-600 font-medium mt-0.5">{item.tagline}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
            <Clock className="w-3 h-3" />
            <span>{item.daysAgo === 0 ? '今日' : `${item.daysAgo}天前`}</span>
          </div>
        </div>

        {/* 技术摘要（始终显示） */}
        {item.tech && (
          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">{item.tech}</p>
        )}

        {/* 商业摘要 */}
        {item.business && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.business}</p>
        )}
      </div>

      {/* 展开详情 */}
      {expanded && (
        <div className="border-t border-slate-50 px-4 pb-4 space-y-3 pt-3">
          {item.team && (
            <div className="flex gap-2">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold mb-0.5">团队</p>
                <p className="text-xs text-slate-600">{item.team}</p>
              </div>
            </div>
          )}
          {item.operations && (
            <div className="flex gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold mb-0.5">运营数据</p>
                <p className="text-xs text-slate-600">{item.operations}</p>
              </div>
            </div>
          )}
          {item.funding && (
            <div className="flex gap-2">
              <Banknote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold mb-0.5">融资状态</p>
                <p className="text-xs text-slate-600">{item.funding}</p>
              </div>
            </div>
          )}
          <a
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <ExternalLink className="w-3 h-3" />
            查看原始来源
          </a>
        </div>
      )}

      {/* 展开/收起按钮 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 py-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition border-t border-slate-50"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expanded ? '收起' : '展开详情'}
      </button>
    </div>
  );
}