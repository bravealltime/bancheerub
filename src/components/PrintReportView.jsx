import React from 'react';
import { formatCurrency, formatThaiMonth, formatThaiDateFull, getTodayString } from '../utils/thaiDate';

export default function PrintReportView({
  selectedMonth,
  userName,
  transactions
}) {
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const printedDate = formatThaiDateFull(getTodayString());

  return (
    <div className="print-only p-4 bg-white text-black font-['Sarabun']">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-5 text-center">
        <h1 className="text-2xl font-bold">สมุดบันทึกรายรับ-รายจ่าย</h1>
        <p className="text-base mt-1">
          ประจำเดือน {formatThaiMonth(selectedMonth)} • ผู้บันทึก: {userName || 'คุณตาคุณยาย'}
        </p>
      </div>

      {/* Summary Box */}
      <div className="grid grid-cols-3 border border-black mb-6 text-center text-sm">
        <div className="p-3 border-r border-black">
          <div className="text-xs">เงินเข้ารวม (รายรับ)</div>
          <div className="text-lg font-bold mt-1">+฿{formatCurrency(totalIncome)} บาท</div>
        </div>
        <div className="p-3 border-r border-black">
          <div className="text-xs">เงินออกรวม (รายจ่าย)</div>
          <div className="text-lg font-bold mt-1">-฿{formatCurrency(totalExpense)} บาท</div>
        </div>
        <div className="p-3">
          <div className="text-xs">เงินคงเหลือสุทธิ</div>
          <div className="text-lg font-bold mt-1">
            {netSavings >= 0 ? '+' : '-'}฿{formatCurrency(Math.abs(netSavings))} บาท
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <h2 className="text-base font-bold mb-2">รายการทั้งหมดในเดือนนี้ ({monthTransactions.length} รายการ)</h2>
      <table className="w-full text-left text-xs border border-black">
        <thead>
          <tr className="bg-stone-100 border-b border-black">
            <th className="p-2 border-r border-black w-24">วันที่</th>
            <th className="p-2 border-r border-black">หมวดหมู่</th>
            <th className="p-2 border-r border-black">รายละเอียด / หมายเหตุ</th>
            <th className="p-2 border-r border-black w-20 text-center">ประเภท</th>
            <th className="p-2 text-right w-28">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          {monthTransactions.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center">ไม่มีรายการในเดือนนี้</td>
            </tr>
          ) : (
            monthTransactions.map((tx) => (
              <tr key={tx.id} className="border-b border-stone-300">
                <td className="p-2 border-r border-black whitespace-nowrap">{tx.date}</td>
                <td className="p-2 border-r border-black font-semibold">{tx.category}</td>
                <td className="p-2 border-r border-black">{tx.note || '-'}</td>
                <td className="p-2 border-r border-black text-center">
                  {tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                </td>
                <td className="p-2 text-right font-bold whitespace-nowrap">
                  {tx.type === 'expense' ? '-' : '+'}฿{formatCurrency(tx.amount)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Signature & Date */}
      <div className="mt-8 pt-4 flex justify-between text-xs">
        <div>พิมพ์เมื่อ: {printedDate}</div>
        <div className="text-right">
          <div>ลงชื่อ: ....................................................</div>
          <div className="mt-1">({userName || 'คุณตาคุณยาย'})</div>
        </div>
      </div>
    </div>
  );
}
