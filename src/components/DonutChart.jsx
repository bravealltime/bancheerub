import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/thaiDate';

// Vibrant, accessible color palette for senior-friendly high contrast
const PALETTE = [
  '#F59E0B', // Amber (Food)
  '#EF4444', // Red (Medicine)
  '#3B82F6', // Blue (Bills)
  '#10B981', // Emerald (Groceries)
  '#8B5CF6', // Purple (Travel)
  '#EC4899', // Pink (Family)
  '#F97316', // Orange (Merit)
  '#06B6D4', // Cyan (Clothes)
  '#84CC16', // Lime (Home)
  '#64748B', // Slate (Other)
];

export default function DonutChart({
  items = [],
  totalAmount = 0,
  title = 'รายจ่ายรวม',
  currency = '฿'
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius; // ~402.12

  const slices = useMemo(() => {
    if (!items || items.length === 0 || totalAmount <= 0) return [];

    const withPercents = items.map((item, idx) => ({
      ...item,
      color: item.color || PALETTE[idx % PALETTE.length],
      percentNum: totalAmount > 0 ? item.total / totalAmount : 0,
      percent: Math.round((totalAmount > 0 ? item.total / totalAmount : 0) * 100),
    }));

    return withPercents.map((item, idx, arr) => {
      const priorAccumulated = arr.slice(0, idx).reduce((sum, prev) => sum + prev.percentNum, 0);
      const strokeDasharray = `${item.percentNum * circumference} ${circumference}`;
      const strokeDashoffset = -priorAccumulated * circumference;

      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [items, totalAmount, circumference]);

  if (!items || items.length === 0 || totalAmount <= 0 || slices.length === 0) {
    return (
      <div className="bg-[#FAF9F5] rounded-2xl p-6 text-center border border-stone-200 text-stone-500 space-y-2">
        <div className="text-3xl">🍩</div>
        <p className="text-xs sm:text-sm font-semibold">ยังไม่มีข้อมูลรายจ่ายในเดือนนี้</p>
      </div>
    );
  }

  const activeItem = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="bg-[#FAF9F5] rounded-2xl p-3.5 sm:p-4 border border-stone-200 space-y-3">
      {/* Donut SVG Circle */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto flex items-center justify-center">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          {/* Base Background Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#E7E5E4"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {slices.map((slice, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <circle
                key={slice.category || idx}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(isHovered ? null : idx)}
              />
            );
          })}
        </svg>

        {/* Center Label in Donut Hole */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {activeItem ? (
            <div className="animate-fade">
              <span className="text-xl sm:text-2xl block">{activeItem.icon}</span>
              <span className="text-xs sm:text-sm font-bold text-stone-900 block truncate max-w-[110px]">
                {activeItem.category}
              </span>
              <span className="text-xs font-bold font-['Prompt'] text-[#E11D48] block">
                {currency}{formatCurrency(activeItem.total)}
              </span>
              <span className="text-[10px] font-semibold text-stone-500 bg-stone-200/80 px-1.5 py-0.2 rounded-md">
                {activeItem.percent}%
              </span>
            </div>
          ) : (
            <div>
              <span className="text-[11px] sm:text-xs text-stone-500 font-semibold block">
                {title}
              </span>
              <span className="text-base sm:text-lg font-bold font-['Prompt'] text-stone-900 block">
                {currency}{formatCurrency(totalAmount)}
              </span>
              <span className="text-[10px] text-stone-400 block">แตะที่สีเพื่อดู</span>
            </div>
          )}
        </div>
      </div>

      {/* Legend Grid Below */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
        {slices.slice(0, 6).map((slice, idx) => (
          <button
            key={slice.category || idx}
            type="button"
            onClick={() => setHoveredIndex(hoveredIndex === idx ? null : idx)}
            className={`flex items-center justify-between p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
              hoveredIndex === idx
                ? 'bg-white border-stone-400 shadow-2xs ring-1 ring-stone-300'
                : 'bg-white/70 border-stone-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate font-semibold text-stone-800">
                {slice.icon} {slice.category}
              </span>
            </div>
            <span className="font-bold text-stone-700 font-['Prompt'] text-[11px] shrink-0 ml-1">
              {slice.percent}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
