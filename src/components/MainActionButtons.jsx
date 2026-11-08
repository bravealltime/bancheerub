import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { playTapSound } from '../utils/audio';

export default function MainActionButtons({ onOpenExpense, onOpenIncome, onOpenVoice }) {
  return (
    <div className="space-y-2.5 my-3 sm:my-4 w-full">
      {/* 2 Main Action Buttons: Expense & Income */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* จดรายจ่าย */}
        <button
          type="button"
          onClick={() => {
            playTapSound();
            onOpenExpense();
          }}
          className="btn-tactile group relative overflow-hidden bg-gradient-to-br from-[#E11D48] to-[#BE123C] hover:from-[#BE123C] hover:to-[#9F1239] text-white p-3.5 sm:p-4 min-h-[76px] rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md border border-rose-400/20 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-w-0"
          aria-label="บันทึกรายจ่าย"
        >
          <div className="flex items-center justify-center gap-2 mb-1 max-w-full">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight leading-normal">
              จดรายจ่าย
            </span>
          </div>
          <span className="text-xs sm:text-sm text-white/85 font-normal leading-normal text-wrap-safe">
            กับข้าว, ค่ายา, ของใช้
          </span>
        </button>

        {/* จดรายรับ */}
        <button
          type="button"
          onClick={() => {
            playTapSound();
            onOpenIncome();
          }}
          className="btn-tactile group relative overflow-hidden bg-gradient-to-br from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white p-3.5 sm:p-4 min-h-[76px] rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md border border-emerald-400/20 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-w-0"
          aria-label="บันทึกรายรับ"
        >
          <div className="flex items-center justify-center gap-2 mb-1 max-w-full">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight leading-normal">
              จดรายรับ
            </span>
          </div>
          <span className="text-xs sm:text-sm text-white/85 font-normal leading-normal text-wrap-safe">
            ลูกให้, บำนาญ, ค้าขาย
          </span>
        </button>
      </div>

      {/* 🎙️ Quick Voice Recorder Bar with AI Math Accounting */}
      {onOpenVoice && (
        <button
          type="button"
          onClick={() => {
            playTapSound();
            onOpenVoice();
          }}
          className="w-full btn-tactile group relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white px-3 sm:px-3.5 py-2.5 min-h-[50px] rounded-2xl shadow-xs hover:shadow-md border border-amber-300/30 flex items-center justify-between gap-2 text-left cursor-pointer transition-all"
          aria-label="พูดเพื่อบันทึกด้วย AI"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform shadow-inner">
              🤖
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs sm:text-sm tracking-tight text-white leading-tight">
                  พูดบันทึกด้วย AI (คำนวณเลข & แยกรายการ)
                </span>
                <span className="text-[10px] font-black bg-white/25 text-white px-1.5 py-0.2 rounded-md">
                  ใหม่ ✨
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-amber-100 font-normal block truncate leading-tight">
                เช่น ซื้อไก่ 20 ชิ้น ชิ้นละ 10 บาท ได้เงินจากพ่อ 300 บาท
              </span>
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-bold bg-white text-stone-900 px-2.5 py-1 rounded-xl shrink-0 shadow-2xs whitespace-nowrap">
            แตะแล้วพูด 🎙️
          </span>
        </button>
      )}
    </div>
  );
}
