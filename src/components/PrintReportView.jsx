import React, { useMemo } from 'react';
import { formatCurrency, formatBaht, formatThaiMonth, formatThaiDateFull, getTodayString } from '../utils/thaiDate';

export default function PrintReportView({
  selectedMonth,
  userName,
  transactions = []
}) {
  const monthTransactions = transactions.filter(t => (t.date || '').startsWith(selectedMonth));

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

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netSavings = totalIncome - totalExpense;
  const printedDate = formatThaiDateFull(getTodayString());

  return (
    <div className="print-only p-6 bg-white text-black font-['Sarabun']">
      {/* Authentic Bank Passbook Header */}
      <div className="border-b-2 border-stone-800 pb-3 mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight">สมุดบัญชีเงินฝากครอบครัว</span>
            <span className="text-xs px-2 py-0.5 rounded border border-black font-bold">PASSBOOK</span>
          </div>
          <p className="text-xs mt-1 text-stone-700">
            เลขที่บัญชี: 889-01452-9 • ชื่อบัญชี: <strong>{userName || 'ครอบครัว'}</strong> • ประจำเดือน: <strong>{formatThaiMonth(selectedMonth)}</strong>
          </p>
        </div>
        <div className="text-right text-xs">
          <div className="font-bold">สาขา: ในครอบครัว</div>
          <div className="text-stone-500">พิมพ์เมื่อ: {printedDate}</div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="grid grid-cols-3 border border-stone-800 mb-5 text-center text-xs">
        <div className="p-2.5 border-r border-stone-800">
          <div className="text-[11px] text-stone-600">ฝากเข้ารวม (+)</div>
          <div className="text-base font-bold mt-0.5 text-[#059669]">+฿{formatCurrency(totalIncome)} บาท</div>
        </div>
        <div className="p-2.5 border-r border-stone-800">
          <div className="text-[11px] text-stone-600">ถอนออกรวม (-)</div>
          <div className="text-base font-bold mt-0.5 text-[#E11D48]">-฿{formatCurrency(totalExpense)} บาท</div>
        </div>
        <div className="p-2.5">
          <div className="text-[11px] text-stone-600">ยอดคงเหลือสุทธิประจำเดือน</div>
          <div className="text-base font-bold mt-0.5 text-stone-900">
            {netSavings >= 0 ? '+' : '-'}฿{formatCurrency(Math.abs(netSavings))} บาท
          </div>
        </div>
      </div>

      {/* Itemized Passbook Table */}
      <h2 className="text-xs font-bold mb-1.5">รายการความเคลื่อนไหวทั้งหมด ({monthTransactions.length} รายการ)</h2>
      <table className="w-full text-left text-xs border border-stone-800">
        <thead>
          <tr className="bg-stone-100 border-b border-stone-800 text-stone-900 font-bold">
            <th className="p-2 border-r border-stone-800 w-24">ว/ด/ป</th>
            <th className="p-2 border-r border-stone-800 w-28">หมวดหมู่</th>
            <th className="p-2 border-r border-stone-800">รายละเอียด / หมายเหตุ</th>
            <th className="p-2 border-r border-stone-800 text-right w-24 text-[#E11D48]">ถอนออก (-)</th>
            <th className="p-2 border-r border-stone-800 text-right w-24 text-[#059669]">ฝากเข้า (+)</th>
            <th className="p-2 text-right w-28">ยอดคงเหลือ (บาท)</th>
          </tr>
        </thead>
        <tbody>
          {monthTransactions.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-4 text-center">ไม่มีรายการในเดือนนี้</td>
            </tr>
          ) : (
            monthTransactions.map((tx) => (
              <tr key={tx.id} className="border-b border-stone-300">
                <td className="p-2 border-r border-stone-800 whitespace-nowrap">
                  <div>{tx.date}</div>
                  {tx.time && <div className="text-[10px] text-stone-500">{tx.time} น.</div>}
                </td>
                <td className="p-2 border-r border-stone-800 font-semibold">{tx.category}</td>
                <td className="p-2 border-r border-stone-800">{tx.note || '-'}</td>
                <td className="p-2 border-r border-stone-800 text-right font-bold text-[#E11D48] whitespace-nowrap">
                  {tx.type === 'expense' ? `-${formatCurrency(tx.amount)}` : '-'}
                </td>
                <td className="p-2 border-r border-stone-800 text-right font-bold text-[#059669] whitespace-nowrap">
                  {tx.type === 'income' ? `+${formatCurrency(tx.amount)}` : '-'}
                </td>
                <td className="p-2 text-right font-bold whitespace-nowrap">
                  {formatBaht(runningBalanceMap[tx.id] ?? 0)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Signature & Date */}
      <div className="mt-8 pt-4 flex justify-between text-xs border-t border-dashed border-stone-400">
        <div>• เอกสารฉบับนี้พิมพ์จากระบบสมุดเงินทอง ครอบครัว (บันทึกเมื่อ: {printedDate})</div>
        <div className="text-right">
          <div>ลงชื่อ: .................................................... ผู้บันทึก</div>
          <div className="mt-1">({userName || 'คุณตาคุณยาย'})</div>
        </div>
      </div>
    </div>
  );
}
