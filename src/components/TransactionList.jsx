import React, { useState, useMemo } from 'react';
import { Trash2, Edit3, Volume2, Search, Camera, X, ArrowDownRight, ArrowUpRight, BookOpen } from 'lucide-react';
import { formatThaiDateHeader, formatCurrency } from '../utils/thaiDate';
import { playTapSound, playDeleteSound, speakThai } from '../utils/audio';

export default function TransactionList({
  transactions = [],
  onEdit,
  onDelete,
  soundEnabled,
  accounts = [],
  activeAccountId = 'all'
}) {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);

  // 1. Compute chronological running balance across ALL transactions in the book (oldest to newest)
  const runningBalanceMap = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const dateCmp = (a.date || '').localeCompare(b.date || '');
      if (dateCmp !== 0) return dateCmp;
      if (a.time && b.time) {
        const timeCmp = a.time.localeCompare(b.time);
        if (timeCmp !== 0) return timeCmp;
      }
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

  // Counts for filter tabs
  const totalCount = transactions.length;
  const expenseCount = useMemo(() => transactions.filter(t => t.type === 'expense').length, [transactions]);
  const incomeCount = useMemo(() => transactions.filter(t => t.type === 'income').length, [transactions]);

  // 2. Filter transactions based on active filter and search query
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchCat = (tx.category || '').toLowerCase().includes(q);
      const matchNote = (tx.note || '').toLowerCase().includes(q);
      if (!matchCat && !matchNote) return false;
    }
    return true;
  });

  // 3. Group by Date (Reverse chronological: newest date first)
  const groupedByDate = filteredTransactions.reduce((acc, tx) => {
    const d = tx.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(tx);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const handleSpeakItem = (tx, balance) => {
    playTapSound();
    const typeWord = tx.type === 'expense' ? 'รายจ่าย' : 'รายรับ';
    let speech = `${typeWord} ${tx.category} ยอด ${Math.round(tx.amount)} บาท`;
    if (tx.note) {
      speech += ` หมายเหตุ ${tx.note}`;
    }
    if (typeof balance === 'number') {
      speech += ` ยอดคงเหลือสะสม ${Math.round(balance)} บาทครับ`;
    }
    speakThai(speech);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      playDeleteSound();
      onDelete(itemToDelete.id);
      if (soundEnabled) {
        speakThai('ลบรายการเรียบร้อยแล้วครับ');
      }
      setItemToDelete(null);
    }
  };

  const getAccountInfo = (accId) => {
    return accounts.find(a => a.id === (accId || 'acc-home')) || { name: 'เงินบ้าน', icon: '🏠' };
  };

  return (
    <div className="mt-4 sm:mt-5 w-full">
      {/* Title & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
              ประวัติรายการบันทึก
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500">
              แสดงเงินเข้า-ออก พร้อมยอดคงเหลือสะสมทุกรายการ
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-3 bg-[#EBE7DF] p-1 rounded-xl gap-1 w-full sm:w-auto">
          <button
            onClick={() => {
              playTapSound();
              setFilterType('all');
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer truncate ${
              filterType === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ทั้งหมด ({totalCount})
          </button>
          <button
            onClick={() => {
              playTapSound();
              setFilterType('expense');
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer truncate ${
              filterType === 'expense'
                ? 'bg-[#BA3C2A] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#BA3C2A]'
            }`}
          >
            รายจ่าย ({expenseCount})
          </button>
          <button
            onClick={() => {
              playTapSound();
              setFilterType('income');
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer truncate ${
              filterType === 'income'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#2D6A4F]'
            }`}
          >
            รายรับ ({incomeCount})
          </button>
        </div>
      </div>

      {/* Search */}
      {transactions.length > 5 && (
        <div className="relative mb-3 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามหมวดหมู่ หรือข้อความหมายเหตุ..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-stone-500 shadow-2xs"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-xs text-stone-400 hover:text-stone-600 font-medium cursor-pointer"
            >
              ล้าง
            </button>
          )}
        </div>
      )}

      {/* Items Grouped by Date */}
      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 text-center border border-stone-200 shadow-xs my-3 space-y-2">
          <div className="text-4xl">📒✨</div>
          <p className="text-base sm:text-lg font-bold text-stone-800">
            {searchQuery ? 'ไม่พบรายการที่ตรงกับคำค้นหา' : 'ยังไม่มีรายการในสมุดนี้'}
          </p>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
            {searchQuery
              ? 'ลองค้นหาด้วยคำอื่น หรือกด "ล้าง" เพื่อดูรายการทั้งหมด'
              : 'แตะปุ่มสีแดงเพื่อ "จดรายจ่าย" หรือปุ่มสีเขียวเพื่อ "จดรายรับ" ด้านบนเพื่อเริ่มบันทึกได้เลยครับ'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {sortedDates.map((dateStr) => {
            const dateItems = groupedByDate[dateStr];

            // Sort items within the day newest first
            const sortedDateItems = [...dateItems].sort((a, b) => {
              if (a.time && b.time) {
                const timeCmp = b.time.localeCompare(a.time);
                if (timeCmp !== 0) return timeCmp;
              }
              return (b.createdAt || 0) - (a.createdAt || 0);
            });
            
            const dayIncome = dateItems
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + Number(t.amount || 0), 0);
            const dayExpense = dateItems
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + Number(t.amount || 0), 0);

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date Header with Daily Subtotals */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#EAE7DF] border border-stone-300/80 px-3.5 py-1.5 rounded-xl text-stone-800 shadow-2xs">
                  <span className="font-bold text-xs sm:text-sm truncate">
                    📅 {formatThaiDateHeader(dateStr)}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-bold flex-shrink-0">
                    {dayIncome > 0 && (
                      <span className="text-[#2D6A4F] bg-white/70 px-2 py-0.5 rounded-md border border-[#2D6A4F]/20">
                        +฿{formatCurrency(dayIncome)}
                      </span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-[#BA3C2A] bg-white/70 px-2 py-0.5 rounded-md border border-[#BA3C2A]/20">
                        -฿{formatCurrency(dayExpense)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {sortedDateItems.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const accInfo = getAccountInfo(tx.accountId);
                    const runningBalance = runningBalanceMap[tx.id];

                    return (
                      <div
                        key={tx.id}
                        className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border transition-all shadow-xs hover:shadow-sm ${
                          isExpense
                            ? 'border-rose-200/80 hover:border-rose-400 border-l-[6px] border-l-[#BA3C2A]'
                            : 'border-emerald-200/80 hover:border-emerald-400 border-l-[6px] border-l-[#2D6A4F]'
                        }`}
                      >
                        {/* Main Flex Row */}
                        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                          {/* Left: Icon & Description */}
                          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                            {/* Category Emoji Icon Box */}
                            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs ${
                              isExpense
                                ? 'bg-rose-50 text-[#BA3C2A] border border-rose-200/60'
                                : 'bg-emerald-50 text-[#2D6A4F] border border-emerald-200/60'
                            }`}>
                              {tx.categoryIcon || (isExpense ? '🛒' : '💰')}
                            </div>

                            {/* Info Block */}
                            <div className="min-w-0 flex-1">
                              {/* Category Name & Type Tag */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold inline-flex items-center gap-1 flex-shrink-0 ${
                                  isExpense
                                    ? 'bg-rose-100 text-[#BA3C2A]'
                                    : 'bg-emerald-100 text-[#2D6A4F]'
                                }`}>
                                  {isExpense ? (
                                    <>
                                      <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                                      <span>รายจ่าย</span>
                                    </>
                                  ) : (
                                    <>
                                      <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                                      <span>รายรับ</span>
                                    </>
                                  )}
                                </span>

                                <h4 className="text-sm sm:text-base font-bold text-stone-900 truncate">
                                  {tx.category}
                                </h4>

                                {soundEnabled && (
                                  <button
                                    onClick={() => handleSpeakItem(tx, runningBalance)}
                                    className="text-stone-400 hover:text-stone-800 p-1 rounded-md hover:bg-stone-100 cursor-pointer flex-shrink-0 transition-colors"
                                    title="แตะเพื่อฟังเสียง"
                                    aria-label="ฟังเสียง"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Note (if present) */}
                              {tx.note && (
                                <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1 break-words">
                                  {tx.note}
                                </p>
                              )}

                              {/* Meta: Time, Account, Slip Photo */}
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 mt-1.5">
                                {tx.time && (
                                  <span className="font-medium text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                                    🕒 {tx.time} น.
                                  </span>
                                )}

                                {/* Account badge if viewing all accounts */}
                                {activeAccountId === 'all' && (
                                  <span className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600 font-medium">
                                    {accInfo.icon} {accInfo.name}
                                  </span>
                                )}

                                {/* Photo Slip / Receipt Badge */}
                                {tx.image && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playTapSound();
                                      setViewingImage(tx.image);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                                    title="แตะเพื่อดูรูปภาพสลิป/ใบเสร็จ"
                                  >
                                    <Camera className="w-3.5 h-3.5 text-amber-700" />
                                    <span>ดูรูปสลิป</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Amount & Running Balance */}
                          <div className="flex flex-col items-end flex-shrink-0 text-right min-w-[110px] sm:min-w-[130px]">
                            {/* Transaction Amount */}
                            <span className={`text-base sm:text-lg lg:text-xl font-bold font-['Prompt'] whitespace-nowrap tracking-tight ${
                              isExpense ? 'text-[#BA3C2A]' : 'text-[#2D6A4F]'
                            }`}>
                              {isExpense ? '- ' : '+ '}฿{formatCurrency(tx.amount)}
                            </span>

                            {/* Running Balance Badge (เหมือนสมุดธนาคาร) */}
                            <div
                              className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] sm:text-xs font-semibold whitespace-nowrap shadow-2xs ${
                                (runningBalance ?? 0) >= 0
                                  ? 'bg-stone-50 text-stone-700 border-stone-300/80'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                              title="ยอดคงเหลือสะสมสุทธิหลังทำรายการนี้"
                            >
                              <span className="text-stone-500 font-normal">คงเหลือ:</span>
                              <span className="font-bold font-['Prompt']">
                                ฿{formatCurrency(runningBalance ?? 0)}
                              </span>
                            </div>

                            {/* Actions: Edit & Delete Buttons */}
                            <div className="flex items-center gap-1.5 mt-2">
                              <button
                                onClick={() => {
                                  playTapSound();
                                  onEdit(tx);
                                }}
                                className="btn-tactile p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 cursor-pointer transition-colors"
                                title="แก้ไขรายการนี้"
                                aria-label="แก้ไข"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  playTapSound();
                                  setItemToDelete(tx);
                                }}
                                className="btn-tactile p-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 border border-stone-200 cursor-pointer transition-colors"
                                title="ลบรายการนี้"
                                aria-label="ลบ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-stone-300 shadow-2xl text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-[#BA3C2A] flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              ยืนยันการลบรายการ
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm">
              ต้องการลบรายการ "{itemToDelete.category}" ยอด ฿{formatCurrency(itemToDelete.amount)} ใช่ไหมครับ?
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="btn-tactile flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                className="btn-tactile flex-1 py-2.5 rounded-xl bg-[#BA3C2A] hover:bg-[#a33424] text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Receipt / Slip Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-3 sm:p-4 animate-fade no-print"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-lg w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-11 right-0 text-white p-1.5 rounded-full bg-white/20 hover:bg-white/30 cursor-pointer"
              aria-label="ปิดรูปภาพ"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={viewingImage}
              alt="รูปสลิปหรือใบเสร็จ"
              className="max-w-full max-h-[82vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
