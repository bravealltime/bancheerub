import React, { useMemo } from 'react';
import { X, Printer, Share2, Volume2, BookOpen } from 'lucide-react';
import { formatCurrency, formatBaht, formatThaiMonth, getTodayString } from '../utils/thaiDate';
import { playTapSound, speakThai } from '../utils/audio';

export default function PassbookViewModal({
  isOpen,
  onClose,
  transactions = [],
  currentBookName = 'คุณตาคุณยาย',
  selectedMonth = getTodayString().slice(0, 7),
  onOpenShare,
  soundEnabled
}) {
  // Compute running balance chronologically across all transactions
  const runningBalanceMap = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const dateCmp = (a.date || '').localeCompare(b.date || '');
      if (dateCmp !== 0) return dateCmp;
      if (a.time && b.time && a.time !== b.time) return a.time.localeCompare(b.time);
      if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    let running = 0;
    const map = {};
    for (const tx of sorted) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        running += amt;
      } else {
        running -= amt;
      }
      map[tx.id] = running;
    }
    return map;
  }, [transactions]);

  if (!isOpen) return null;

  // Filter transactions by selected month
  const monthTransactions = transactions.filter(t => (t.date || '').startsWith(selectedMonth));

  // Chronological list for passbook print (Page 1 top to bottom)
  const sortedMonthItems = [...monthTransactions].sort((a, b) => {
    const dateCmp = (a.date || '').localeCompare(b.date || '');
    if (dateCmp !== 0) return dateCmp;
    if (a.time && b.time && a.time !== b.time) return a.time.localeCompare(b.time);
    if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netSavings = totalIncome - totalExpense;
  const currentRunningBalance = sortedMonthItems.length > 0
    ? runningBalanceMap[sortedMonthItems[sortedMonthItems.length - 1].id]
    : 0;

  const handlePrint = () => {
    playTapSound();
    window.print();
  };

  const handleSpeak = () => {
    playTapSound();
    const monthStr = formatThaiMonth(selectedMonth);
    const text = `สมุดบัญชีเงินฝากครอบครัว ประจำ${monthStr} บัญชีของ ${currentBookName} เงินเข้ารวม ${Math.round(totalIncome)} บาท เงินออกรวม ${Math.round(totalExpense)} บาท มียอดคงเหลือสุทธิ ${Math.round(currentRunningBalance ?? 0)} บาทครับ`;
    speakThai(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-2.5 sm:p-4 no-print animate-fade overflow-y-auto">
      <div 
        className="w-full max-w-3xl bg-[#FAF8F5] rounded-3xl border-2 border-[#E7DFD5] shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Passbook Header - Authentic Navy/Gold Bank Passbook styling */}
        <div className="bg-[#14233C] text-white p-3.5 sm:p-5 flex items-center justify-between border-b-4 border-amber-400/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              📖
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  สมุดบัญชีเงินฝากครอบครัว
                </h2>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-stone-950">
                  PASSBOOK
                </span>
              </div>
              <p className="text-xs text-stone-300 truncate mt-0.5">
                เลขที่: 889-01452-9 • ชื่อบัญชี: <span className="font-bold text-amber-200">{currentBookName}</span> • ประจำ {formatThaiMonth(selectedMonth)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {soundEnabled && (
              <button
                type="button"
                onClick={handleSpeak}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                title="ฟังเสียงสรุปสมุดบัญชี"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              aria-label="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Bar (Print / PDF / Share) */}
        <div className="bg-white p-2.5 sm:p-3 border-b border-stone-200 flex items-center justify-between gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>ยอดคงเหลือในสมุด:</span>
            <span className="text-sm sm:text-base font-bold font-['Prompt'] text-stone-900">
              {formatBaht(currentRunningBalance ?? 0)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenShare && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  const monthText = formatThaiMonth(selectedMonth);
                  const title = `สมุดบัญชีประจำ${monthText}`;
                  const text = `📒 สมุดเงินทอง ครอบครัว\n👤 บัญชีของ: ${currentBookName}\n📅 ประจำ${monthText}\n━━━━━━━━━━━━━━━\n🟢 เงินเข้ารวม: +฿${formatCurrency(totalIncome)}\n🔴 เงินออกรวม: -฿${formatCurrency(totalExpense)}\n💰 ยอดคงเหลือสะสม: ${formatBaht(currentRunningBalance ?? 0)}\n━━━━━━━━━━━━━━━\n✨ เปิดดูในเว็บ: https://bancheerub.vercel.app`;
                  onOpenShare({ title, text });
                }}
                className="btn-tactile px-3 py-1.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>ส่งเข้า LINE</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="btn-tactile px-3 py-1.5 rounded-xl bg-[#14233C] hover:bg-[#0F1B2F] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="บันทึกเป็น PDF หรือ พิมพ์ลงกระดาษ"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>ดาวน์โหลด PDF / พิมพ์</span>
            </button>
          </div>
        </div>

        {/* Passbook Inner Paper Ledger (Scrollable Table) */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-[#FFFDF9] space-y-4">
          {/* Top Passbook Summary Pill Row */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold bg-stone-100/80 p-2.5 rounded-2xl border border-stone-200">
            <div>
              <span className="text-stone-500 block text-[11px]">ฝากเข้ารวม (+)</span>
              <span className="text-sm sm:text-base font-bold font-['Prompt'] text-[#059669]">
                +฿{formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="border-x border-stone-300">
              <span className="text-stone-500 block text-[11px]">ถอนออกรวม (-)</span>
              <span className="text-sm sm:text-base font-bold font-['Prompt'] text-[#E11D48]">
                -฿{formatCurrency(totalExpense)}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block text-[11px]">ส่วนต่างสุทธิ</span>
              <span className={`text-sm sm:text-base font-bold font-['Prompt'] ${
                netSavings >= 0 ? 'text-[#059669]' : 'text-[#E11D48]'
              }`}>
                {netSavings >= 0 ? '+' : '-'}฿{formatCurrency(Math.abs(netSavings))}
              </span>
            </div>
          </div>

          {/* Passbook Ledger Table */}
          <div className="border border-stone-300 rounded-2xl overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F2ECE4] border-b border-stone-300 text-stone-800 font-bold text-[11px] sm:text-xs">
                  <th className="p-2 sm:p-2.5 border-r border-stone-300 w-24">ว/ด/ป</th>
                  <th className="p-2 sm:p-2.5 border-r border-stone-300">รายการบันทึก</th>
                  <th className="p-2 sm:p-2.5 border-r border-stone-300 text-right w-24 sm:w-28 text-[#E11D48]">
                    ถอน/ออก (-)
                  </th>
                  <th className="p-2 sm:p-2.5 border-r border-stone-300 text-right w-24 sm:w-28 text-[#059669]">
                    ฝาก/เข้า (+)
                  </th>
                  <th className="p-2 sm:p-2.5 text-right w-24 sm:w-28 text-stone-900">
                    คงเหลือ
                  </th>
                </tr>
              </thead>
              <tbody className="font-['Prompt'] divide-y divide-stone-200">
                {sortedMonthItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400 italic">
                      ยังไม่มีรายการในสมุดเล่มนี้สำหรับเดือนนี้
                    </td>
                  </tr>
                ) : (
                  sortedMonthItems.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const running = runningBalanceMap[tx.id];

                    return (
                      <tr key={tx.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="p-2 sm:p-2.5 border-r border-stone-200 whitespace-nowrap text-stone-600 font-medium">
                          <div>{tx.date}</div>
                          {tx.time && <div className="text-[10px] text-stone-400">{tx.time} น.</div>}
                        </td>
                        <td className="p-2 sm:p-2.5 border-r border-stone-200 font-medium text-stone-900">
                          <div className="font-semibold">{tx.category}</div>
                          {tx.note && <div className="text-[11px] text-stone-500 line-clamp-1">{tx.note}</div>}
                        </td>
                        <td className="p-2 sm:p-2.5 border-r border-stone-200 text-right font-bold text-[#E11D48] whitespace-nowrap">
                          {isExpense ? `-${formatCurrency(tx.amount)}` : '-'}
                        </td>
                        <td className="p-2 sm:p-2.5 border-r border-stone-200 text-right font-bold text-[#059669] whitespace-nowrap">
                          {!isExpense ? `+${formatCurrency(tx.amount)}` : '-'}
                        </td>
                        <td className="p-2 sm:p-2.5 text-right font-bold text-stone-800 whitespace-nowrap">
                          {formatCurrency(running ?? 0)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bank Stamp & Signatures Footer */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-stone-400 border-t border-dashed border-stone-300">
            <div>
              <span>• ตรวจสอบความถูกต้องโดยคนในครอบครัว</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-stone-600">
              <span>ตราประทับเสมือน:</span>
              <span className="px-2 py-0.5 rounded-md border border-stone-300 bg-stone-100 text-[10px] text-stone-700">
                VERIFIED 🟢
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#FAF8F5] border-t border-stone-200 shrink-0 text-center">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="btn-tactile w-full py-2.5 rounded-2xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs sm:text-sm cursor-pointer"
          >
            ปิดหน้าต่างสมุดบัญชี
          </button>
        </div>
      </div>
    </div>
  );
}
