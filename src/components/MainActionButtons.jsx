import React from 'react';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { playTapSound } from '../utils/audio';

export default function MainActionButtons({ onOpenExpense, onOpenIncome }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-3 sm:my-4 w-full">
      {/* จดรายจ่าย */}
      <button
        onClick={() => {
          playTapSound();
          onOpenExpense();
        }}
        className="btn-tactile bg-[#BA3C2A] hover:bg-[#A33423] text-white p-2.5 sm:p-4 rounded-2xl shadow-xs border border-[#A33423] flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-w-0"
        aria-label="บันทึกรายจ่าย"
      >
        <div className="flex items-center justify-center gap-1.5 mb-0.5 max-w-full">
          <MinusCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] flex-shrink-0" />
          <span className="text-base sm:text-lg font-bold truncate">
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
        className="btn-tactile bg-[#2D6A4F] hover:bg-[#24563F] text-white p-2.5 sm:p-4 rounded-2xl shadow-xs border border-[#24563F] flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-w-0"
        aria-label="บันทึกรายรับ"
      >
        <div className="flex items-center justify-center gap-1.5 mb-0.5 max-w-full">
          <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] flex-shrink-0" />
          <span className="text-base sm:text-lg font-bold truncate">
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
