import React, { useState } from 'react';
import { X, Calendar, Volume2, Share2, Printer } from 'lucide-react';
import { formatCurrency, formatThaiMonth, getTodayString } from '../utils/thaiDate';
import { playTapSound, speakThai } from '../utils/audio';
import { shareSummary, generateSummaryText } from '../utils/shareLine';

export default function MonthlyReportModal({
  isOpen,
  onClose,
  transactions,
  soundEnabled,
  totalBalance,
  onOpenShare
}) {
  const currentYearMonth = getTodayString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);
  const [shareFeedback, setShareFeedback] = useState('');

  if (!isOpen) return null;

  const availableMonths = Array.from(
    new Set([currentYearMonth, ...transactions.map(t => t.date.slice(0, 7))])
  ).sort((a, b) => b.localeCompare(a));

  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  const expenseByCategory = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const cat = t.category;
      if (!acc[cat]) {
        acc[cat] = {
          category: cat,
          icon: t.categoryIcon || '🍲',
          total: 0
        };
      }
      acc[cat].total += t.amount;
      return acc;
    }, {});

  const sortedExpenses = Object.values(expenseByCategory).sort((a, b) => b.total - a.total);

  const handleSpeakSummary = () => {
    playTapSound();
    const monthText = formatThaiMonth(selectedMonth);
    let speech = `สรุปรายรับรายจ่ายประจำ${monthText}ครับ เงินเข้าทั้งหมด ${Math.round(totalIncome)} บาท เงินออกทั้งหมด ${Math.round(totalExpense)} บาท `;
    if (netSavings >= 0) {
      speech += `มีเงินเหลือเก็บ ${Math.round(netSavings)} บาทครับ`;
    } else {
      speech += `ใช้เงินมากกว่ารายรับ ${Math.round(Math.abs(netSavings))} บาทครับ`;
    }
    speakThai(speech);
  };

  const handleShareToLine = async () => {
    playTapSound();
    const monthText = formatThaiMonth(selectedMonth);
    const title = `สรุปประจำ${monthText}`;

    if (onOpenShare) {
      const text = generateSummaryText({
        title,
        periodText: monthText,
        totalBalance: totalBalance,
        income: totalIncome,
        expense: totalExpense,
        transactions: monthTransactions
      });
      onOpenShare({ title, text });
    } else {
      await shareSummary({
        title,
        periodText: monthText,
        totalBalance: totalBalance,
        income: totalIncome,
        expense: totalExpense,
        transactions: monthTransactions
      });
      setShareFeedback('เปิดแชร์เรียบร้อย');
      setTimeout(() => setShareFeedback(''), 3000);
    }
  };

  const handlePrint = () => {
    playTapSound();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 overflow-y-auto no-print">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-[#2D3A34] text-white flex items-center justify-between gap-2 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold truncate">
              สรุปยอดรายเดือน
            </h2>
            <p className="text-xs text-stone-300 truncate">
              ภาพรวมเงินเข้า เงินออก และเงินเหลือเก็บ
            </p>
          </div>

          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer flex-shrink-0"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4">
          {/* Month Selector */}
          <div className="flex items-center justify-between gap-2 bg-[#F6F4EF] p-2 sm:p-2.5 rounded-xl border border-stone-200">
            <div className="flex items-center gap-1.5 text-stone-700 font-bold text-xs sm:text-sm flex-shrink-0">
              <Calendar className="w-4 h-4 text-stone-500" />
              <span>เดือน:</span>
            </div>

            <select
              value={selectedMonth}
              onChange={(e) => {
                playTapSound();
                setSelectedMonth(e.target.value);
              }}
              className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs sm:text-sm font-semibold text-stone-800 focus:outline-none min-w-0 max-w-[180px] truncate"
            >
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatThaiMonth(ym)}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action Buttons: Share to LINE & Print to Paper */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShareToLine}
              className="btn-tactile py-2 px-2.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-w-0"
              title="ส่งสรุปเข้า LINE ให้ลูกหลานดู"
            >
              <Share2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{shareFeedback || 'แชร์เข้า LINE'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-tactile py-2 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center justify-center gap-1.5 border border-stone-300 cursor-pointer min-w-0"
              title="พิมพ์สรุปลงกระดาษ A4 หรือบันทึกเป็น PDF"
            >
              <Printer className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">พิมพ์ลงกระดาษ A4</span>
            </button>
          </div>

          {/* Sound readout */}
          {soundEnabled && (
            <button
              onClick={handleSpeakSummary}
              className="btn-tactile w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-stone-300 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">แตะเพื่อฟังเสียงสรุปทั้งเดือน</span>
            </button>
          )}

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#FAF9F5] rounded-xl p-2.5 sm:p-3 border border-stone-200 min-w-0">
              <div className="text-stone-500 text-[11px] sm:text-xs font-semibold mb-0.5 truncate">เงินเข้ารวม</div>
              <div className="text-[#2D6A4F] font-bold text-base sm:text-lg font-['Prompt'] break-all">
                +฿{formatCurrency(totalIncome)}
              </div>
            </div>

            <div className="bg-[#FAF9F5] rounded-xl p-2.5 sm:p-3 border border-stone-200 min-w-0">
              <div className="text-stone-500 text-[11px] sm:text-xs font-semibold mb-0.5 truncate">เงินออกรวม</div>
              <div className="text-[#BA3C2A] font-bold text-base sm:text-lg font-['Prompt'] break-all">
                -฿{formatCurrency(totalExpense)}
              </div>
            </div>

            <div className="col-span-2 bg-[#FAF9F5] rounded-xl p-2.5 sm:p-3 border border-stone-200 min-w-0">
              <div className="text-stone-500 text-[11px] sm:text-xs font-semibold mb-0.5 truncate">เงินเหลือเก็บในเดือนนี้</div>
              <div className={`text-xl sm:text-2xl font-bold font-['Prompt'] break-all ${
                netSavings >= 0 ? 'text-[#2D6A4F]' : 'text-[#BA3C2A]'
              }`}>
                {netSavings >= 0 ? '+' : '-'}฿{formatCurrency(Math.abs(netSavings))}
              </div>
            </div>
          </div>

          {/* Spending Breakdown */}
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-stone-900 mb-2 truncate">
              เงินออกไปกับอะไรบ้าง
            </h4>

            {sortedExpenses.length === 0 ? (
              <p className="text-xs text-stone-500 italic p-3 text-center bg-[#FAF9F5] rounded-xl">
                ไม่มีรายจ่ายในเดือนนี้
              </p>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {sortedExpenses.map((catItem) => {
                  const percent = totalExpense > 0 ? Math.round((catItem.total / totalExpense) * 100) : 0;

                  return (
                    <div key={catItem.category} className="bg-[#FAF9F5] rounded-xl p-2 sm:p-2.5 border border-stone-200">
                      <div className="flex items-center justify-between gap-1 text-xs sm:text-sm font-semibold text-stone-800 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <span className="flex-shrink-0">{catItem.icon}</span>
                          <span className="truncate">{catItem.category}</span>
                        </div>
                        <div className="flex-shrink-0 text-right whitespace-nowrap">
                          <span className="text-[#BA3C2A] font-bold">
                            ฿{formatCurrency(catItem.total)}
                          </span>
                          <span className="text-stone-400 ml-1 text-[11px]">
                            ({percent}%)
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-stone-200 h-1.5 sm:h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#BA3C2A] h-full rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="p-2.5 sm:p-3 bg-[#FAF9F5] border-t border-stone-200 flex-shrink-0">
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="btn-tactile w-full py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs sm:text-sm cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
