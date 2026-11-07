import React, { useState, useMemo } from 'react';
import { Trash2, Edit3, Volume2, Search, Camera, X } from 'lucide-react';
import { formatThaiDateHeader, formatCurrency, formatBaht } from '../utils/thaiDate';
import { playTapSound, playDeleteSound, speakThai } from '../utils/audio';

export default function TransactionList({
  transactions = [],
  onEdit,
  onDelete,
  soundEnabled,
  accounts = [],
  activeAccountId: _activeAccountId = 'all'
}) {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);

  // 1. Compute chronological running balance across ALL transactions in the book (oldest to newest)
  const runningBalanceMap = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      // Date ascending
      const dateCmp = (a.date || '').localeCompare(b.date || '');
      if (dateCmp !== 0) return dateCmp;

      // Time ascending if specified and different
      if (a.time && b.time && a.time !== b.time) {
        return a.time.localeCompare(b.time);
      }

      // On same date/time, income naturally comes BEFORE expense (funds exist before spending)
      if (a.type !== b.type) {
        return a.type === 'income' ? -1 : 1;
      }

      // Fallback to createdAt ascending
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
      {/* Title & Filter Bar (iOS Style Segmented Control) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3.5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
            ประวัติรายการ
          </h3>
          <p className="text-[11px] sm:text-xs text-stone-500 font-normal">
            ยอดเงินเข้า-ออก และเงินคงเหลือสะสม
          </p>
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center bg-stone-200/70 p-1 rounded-2xl w-full sm:w-auto shadow-2xs">
          <button
            onClick={() => {
              playTapSound();
              setFilterType('all');
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ทั้งหมด <span className="opacity-60 font-normal text-[11px]">({totalCount})</span>
          </button>
          <button
            onClick={() => {
              playTapSound();
              setFilterType('expense');
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filterType === 'expense'
                ? 'bg-[#E11D48] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#E11D48]'
            }`}
          >
            รายจ่าย <span className="opacity-80 font-normal text-[11px]">({expenseCount})</span>
          </button>
          <button
            onClick={() => {
              playTapSound();
              setFilterType('income');
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filterType === 'income'
                ? 'bg-[#059669] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#059669]'
            }`}
          >
            รายรับ <span className="opacity-80 font-normal text-[11px]">({incomeCount})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {transactions.length > 5 && (
        <div className="relative mb-3.5 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามหมวดหมู่ หรือข้อความ..."
            className="w-full pl-9 pr-8 py-2 rounded-2xl bg-white border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all shadow-2xs"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-stone-400 hover:text-stone-700 font-semibold cursor-pointer"
            >
              ล้าง
            </button>
          )}
        </div>
      )}

      {/* Items Grouped by Date */}
      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-stone-200/70 shadow-xs my-3 space-y-2.5">
          <div className="text-4xl">📒✨</div>
          <p className="text-base sm:text-lg font-bold text-stone-800">
            {searchQuery ? 'ไม่พบรายการที่ตรงกับคำค้นหา' : 'ยังไม่มีรายการในสมุดนี้'}
          </p>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? 'ลองค้นหาด้วยคำอื่น หรือกด "ล้าง" เพื่อดูรายการทั้งหมด'
              : 'แตะปุ่มสีแดงเพื่อ "จดรายจ่าย" หรือปุ่มสีเขียวเพื่อ "จดรายรับ" ด้านบนเพื่อเริ่มบันทึกได้เลยครับ'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((dateStr) => {
            const dateItems = groupedByDate[dateStr];

            // Sort items within the day: newest activity on top
            const sortedDateItems = [...dateItems].sort((a, b) => {
              if (a.time && b.time && a.time !== b.time) {
                return b.time.localeCompare(a.time);
              }
              // On same date/time, expenses on top (latest outgoing activity)
              if (a.type !== b.type) {
                return a.type === 'expense' ? -1 : 1;
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
                {/* Modern Date Header */}
                <div className="flex items-center justify-between px-2 pt-1 pb-0.5 text-stone-700">
                  <span className="font-bold text-xs sm:text-sm text-stone-800 tracking-tight">
                    {formatThaiDateHeader(dateStr)}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {dayIncome > 0 && (
                      <span className="text-[#059669] font-['Prompt'] font-bold">
                        +฿{formatCurrency(dayIncome)}
                      </span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-[#E11D48] font-['Prompt'] font-bold">
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
                        className="group relative bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-stone-200/70 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.07)] hover:border-stone-300 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Icon & Details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Category Squircle Icon */}
                            <div
                              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-105 duration-200 ${
                                isExpense
                                  ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-500/15'
                                  : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/15'
                              }`}
                            >
                              {tx.categoryIcon || (isExpense ? '🛒' : '💰')}
                            </div>

                            {/* Info Column */}
                            <div className="min-w-0 flex-1">
                              {/* Category Name & Sleek Badge */}
                              <div className="flex items-center gap-2">
                                <h4 className="text-base sm:text-[17px] font-bold text-stone-900 truncate tracking-tight">
                                  {tx.category}
                                </h4>

                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide flex-shrink-0 ${
                                    isExpense
                                      ? 'bg-rose-100/70 text-rose-700'
                                      : 'bg-emerald-100/70 text-emerald-700'
                                  }`}
                                >
                                  {isExpense ? 'รายจ่าย' : 'รายรับ'}
                                </span>

                                {soundEnabled && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSpeakItem(tx, runningBalance);
                                    }}
                                    className="w-6 h-6 rounded-full text-stone-300 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors"
                                    title="แตะเพื่อฟังเสียง"
                                    aria-label="ฟังเสียง"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Note (if available) */}
                              {tx.note && (
                                <p className="text-xs sm:text-sm text-stone-500 font-normal mt-0.5 truncate">
                                  {tx.note}
                                </p>
                              )}

                              {/* Meta: Time, Account, Slip Photo */}
                              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-stone-400 mt-1 font-medium flex-wrap">
                                {tx.time && <span>{tx.time} น.</span>}
                                {tx.time && <span>•</span>}
                                <span>{accInfo.icon} {accInfo.name}</span>

                                {tx.image && (
                                  <>
                                    <span>•</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        playTapSound();
                                        setViewingImage(tx.image);
                                      }}
                                      className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold cursor-pointer hover:underline"
                                    >
                                      <Camera className="w-3 h-3" />
                                      <span>ดูสลิป</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Amount, Running Balance & Actions */}
                          <div className="flex flex-col items-end flex-shrink-0 text-right">
                            {/* Transaction Amount */}
                            <span
                              className={`text-lg sm:text-xl font-bold font-['Prompt'] tracking-tight ${
                                isExpense ? 'text-[#E11D48]' : 'text-[#059669]'
                              }`}
                            >
                              {isExpense ? '- ' : '+ '}฿{formatCurrency(tx.amount)}
                            </span>

                            {/* Running Balance */}
                            <span className="text-xs sm:text-[13px] font-semibold text-stone-400 font-['Prompt'] mt-0.5">
                              คงเหลือ {formatBaht(runningBalance ?? 0)}
                            </span>

                            {/* Tactile Circular Actions */}
                            <div className="flex items-center gap-1.5 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playTapSound();
                                  onEdit(tx);
                                }}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="แก้ไขรายการนี้"
                                aria-label="แก้ไข"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playTapSound();
                                  setItemToDelete(tx);
                                }}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-fade">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-stone-200 shadow-2xl text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-[#E11D48] flex items-center justify-center mx-auto text-xl ring-1 ring-rose-200">
              ⚠️
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              ยืนยันการลบรายการ
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              ต้องการลบรายการ "{itemToDelete.category}" ยอด ฿{formatCurrency(itemToDelete.amount)} ใช่ไหมครับ?
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="btn-tactile flex-1 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                className="btn-tactile flex-1 py-2.5 rounded-2xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
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
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-4 animate-fade no-print"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-lg w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-11 right-0 text-white p-2 rounded-full bg-white/20 hover:bg-white/30 cursor-pointer"
              aria-label="ปิดรูปภาพ"
            >
              <X className="w-5 h-5" />
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
