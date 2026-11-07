import React, { useState } from 'react';
import { Volume2, Wallet, Share2 } from 'lucide-react';
import { formatCurrency, formatThaiDateHeader, getTodayString } from '../utils/thaiDate';
import { speakThai, playTapSound } from '../utils/audio';
import { shareSummary, generateSummaryText } from '../utils/shareLine';

export default function SummaryCard({
  totalBalance,
  todayIncome,
  todayExpense,
  monthIncome,
  monthExpense,
  soundEnabled,
  todayTransactions = [],
  onOpenShare
}) {
  const [viewMode, setViewMode] = useState('today');
  const [shareFeedback, setShareFeedback] = useState('');

  const currentIncome = viewMode === 'today' ? todayIncome : monthIncome;
  const currentExpense = viewMode === 'today' ? todayExpense : monthExpense;

  const handleSpeakSummary = () => {
    playTapSound();
    const periodText = viewMode === 'today' ? 'วันนี้' : 'เดือนนี้';
    const speech = `ยอดเงินคงเหลือรวม ${Math.round(totalBalance)} บาท ครับ ใน${periodText} มีเงินเข้า ${Math.round(currentIncome)} บาท และมีเงินออก ${Math.round(currentExpense)} บาท ครับ`;
    speakThai(speech);
  };

  const handleShare = async () => {
    playTapSound();
    const periodText = viewMode === 'today' ? formatThaiDateHeader(getTodayString()) : 'ประจำเดือนนี้';
    const title = viewMode === 'today' ? 'สรุปยอดวันนี้' : 'สรุปยอดประจำเดือนนี้';

    if (onOpenShare) {
      const text = generateSummaryText({
        title,
        periodText,
        totalBalance,
        income: currentIncome,
        expense: currentExpense,
        transactions: viewMode === 'today' ? todayTransactions : []
      });
      onOpenShare({ title, text });
    } else {
      await shareSummary({
        title,
        periodText,
        totalBalance,
        income: currentIncome,
        expense: currentExpense,
        transactions: viewMode === 'today' ? todayTransactions : []
      });
      setShareFeedback('แชร์แล้ว');
      setTimeout(() => setShareFeedback(''), 2500);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1E3A2F] via-[#244237] to-[#182F26] text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-emerald-900/40 w-full overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-emerald-100/90 text-xs sm:text-sm truncate">
            ยอดเงินคงเหลือทั้งหมด
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Share to Line Button */}
          <button
            onClick={handleShare}
            className="btn-tactile flex items-center gap-1 bg-[#06C755] hover:bg-[#05b34c] text-white px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer shadow-xs"
            title="แชร์สรุปเข้า LINE ให้ลูกหลานดู"
          >
            <Share2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{shareFeedback || 'แชร์ LINE'}</span>
          </button>

          {/* Speak Button */}
          {soundEnabled && (
            <button
              onClick={handleSpeakSummary}
              className="btn-tactile flex items-center gap-1 bg-white/10 hover:bg-white/20 text-stone-200 px-2.5 py-1 rounded-full text-xs font-medium border border-white/10 cursor-pointer transition-colors"
              title="กดเพื่อฟังเสียงสรุปยอดเงิน"
            >
              <Volume2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">ฟังสรุป</span>
            </button>
          )}
        </div>
      </div>

      {/* Balance Amount */}
      <div className="mb-3.5">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-['Prompt'] break-all">
            ฿{formatCurrency(totalBalance)}
          </span>
          <span className="text-emerald-200/80 text-sm sm:text-base font-normal">บาท</span>
        </div>
      </div>

      {/* Period Switcher */}
      <div className="bg-black/25 p-1 rounded-2xl flex gap-1 mb-3.5 backdrop-blur-xs">
        <button
          onClick={() => {
            playTapSound();
            setViewMode('today');
          }}
          className={`flex-1 py-1.5 text-center font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer truncate ${
            viewMode === 'today'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          เฉพาะวันนี้
        </button>
        <button
          onClick={() => {
            playTapSound();
            setViewMode('month');
          }}
          className={`flex-1 py-1.5 text-center font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer truncate ${
            viewMode === 'month'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          ทั้งเดือนนี้
        </button>
      </div>

      {/* Income and Expense Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Income Box */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3.5 text-stone-900 border border-white/30 min-w-0 shadow-2xs">
          <div className="text-stone-500 font-semibold text-[11px] sm:text-xs mb-0.5 truncate">
            เงินเข้า ({viewMode === 'today' ? 'วันนี้' : 'เดือนนี้'})
          </div>
          <div className="text-[#059669] font-bold text-base sm:text-xl font-['Prompt'] break-all">
            +฿{formatCurrency(currentIncome)}
          </div>
        </div>

        {/* Expense Box */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3.5 text-stone-900 border border-white/30 min-w-0 shadow-2xs">
          <div className="text-stone-500 font-semibold text-[11px] sm:text-xs mb-0.5 truncate">
            เงินออก ({viewMode === 'today' ? 'วันนี้' : 'เดือนนี้'})
          </div>
          <div className="text-[#E11D48] font-bold text-base sm:text-xl font-['Prompt'] break-all">
            -฿{formatCurrency(currentExpense)}
          </div>
        </div>
      </div>
    </div>
  );
}
