import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { playTapSound } from '../utils/audio';

export default function MainActionButtons({ onOpenExpense, onOpenIncome }) {
  return (
    <div className="grid grid-cols-2 gap-3 my-3 sm:my-4 w-full">
      {/* จดรายจ่าย */}
      <button
        onClick={() => {
          playTapSound();
          onOpenExpense();
        }}
        className="btn-tactile group relative overflow-hidden bg-gradient-to-br from-[#E11D48] to-[#BE123C] hover:from-[#BE123C] hover:to-[#9F1239] text-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md border border-rose-400/20 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-w-0"
        aria-label="บันทึกรายจ่าย"
      >
        <div className="flex items-center justify-center gap-2 mb-1 max-w-full">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Minus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-base sm:text-lg font-bold truncate tracking-tight">
            จดรายจ่าย
          </span>
        </div>
        <span className="text-[11px] sm:text-xs text-white/80 font-normal line-clamp-1">
          กับข้าว, ค่ายา, ของใช้
        </span>
      </button>

      {/* จดรายรับ */}
      <button
        onClick={() => {
          playTapSound();
          onOpenIncome();
        }}
        className="btn-tactile group relative overflow-hidden bg-gradient-to-br from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md border border-emerald-400/20 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-w-0"
        aria-label="บันทึกรายรับ"
      >
        <div className="flex items-center justify-center gap-2 mb-1 max-w-full">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-base sm:text-lg font-bold truncate tracking-tight">
            จดรายรับ
          </span>
        </div>
        <span className="text-[11px] sm:text-xs text-white/80 font-normal line-clamp-1">
          ลูกให้, บำนาญ, ค้าขาย
        </span>
      </button>
    </div>
  );
}
