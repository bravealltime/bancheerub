import React, { useState, useMemo } from 'react';
import { Trash2, Edit3, Volume2, Search, Camera, X, ChevronRight } from 'lucide-react';
import { formatThaiDateHeader, formatCurrency, formatBaht } from '../utils/thaiDate';
import { playTapSound, playDeleteSound, speakThai } from '../utils/audio';
import TransactionDetailModal from './TransactionDetailModal';

export default function TransactionList({
  transactions = [],
  onEdit,
  onDelete,
  soundEnabled,
  accounts = [],
  activeAccountId: _activeAccountId = 'all',
  currentBookName = 'ครอบครัว'
}) {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState(null);

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

    // Search query filter (matches category, note, amount, and date)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchCat = (tx.category || '').toLowerCase().includes(q);
      const matchNote = (tx.note || '').toLowerCase().includes(q);
      const matchAmt = String(tx.amount || '').includes(q);
      const matchDate = (tx.date || '').includes(q);
      if (!matchCat && !matchNote && !matchAmt && !matchDate) return false;
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-normal">
            ประวัติรายการ
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 font-normal leading-normal">
            แตะที่รายการเพื่อดูสเตตเมนต์/ทรานสคริปต์ฉบับเต็ม
          </p>
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center bg-stone-200/70 p-1 rounded-2xl w-full sm:w-auto shadow-2xs">
          <button
            onClick={() => {
              playTapSound();
              setFilterType('all');
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ทั้งหมด <span className="opacity-70 font-normal text-xs">({totalCount})</span>
          </button>
          <button
            onClick={() => {
              playTapSound();
              setFilterType('expense');
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filterType === 'expense'
                ? 'bg-[#E11D48] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#E11D48]'
            }`}
          >
            รายจ่าย <span className="opacity-80 font-normal text-xs">({expenseCount})</span>
          </button>
          <button
            onClick={() => {
              playTapSound();
              setFilterType('income');
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filterType === 'income'
                ? 'bg-[#059669] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#059669]'
            }`}
          >
            รายรับ <span className="opacity-80 font-normal text-xs">({incomeCount})</span>
          </button>
        </div>
      </div>

      {/* Search Bar - Clean & Minimal */}
      <div className="mb-3">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 ค้นหารายการ (หมวดหมู่, หมายเหตุ, ยอดเงิน)..."
            className="w-full pl-10 pr-9 py-2 min-h-[42px] rounded-2xl bg-white border border-stone-200/90 text-xs sm:text-sm focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all shadow-2xs placeholder-stone-400"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
          
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-700 font-semibold cursor-pointer p-0.5"
              title="ล้างคำค้นหา"
            >
              ✕ ล้าง
            </button>
          )}
        </div>
      </div>

      {/* Items Grouped by Date */}
      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-stone-200/70 shadow-xs my-3 space-y-2.5">
          <div className="text-4xl">📒✨</div>
          <p className="text-base sm:text-lg font-bold text-stone-800 leading-normal">
            {searchQuery ? 'ไม่พบรายการที่ตรงกับคำค้นหา' : 'ยังไม่มีรายการในสมุดนี้'}
          </p>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? 'ลองค้นหาด้วยคำอื่น หรือกด "ล้าง" ด้านบนเพื่อดูรายการทั้งหมดครับ'
              : 'แตะปุ่มสีแดงเพื่อ "จดรายจ่าย" หรือปุ่มสีเขียวเพื่อ "จดรายรับ" ด้านบนเพื่อเริ่มบันทึกได้เลยครับ'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn-tactile px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-bold cursor-pointer"
            >
              แสดงรายการทั้งหมด
            </button>
          )}
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
                  <span className="font-bold text-xs sm:text-sm text-stone-800 tracking-tight leading-normal">
                    {formatThaiDateHeader(dateStr)}
                  </span>
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
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
                <div className="space-y-2.5">
                  {sortedDateItems.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const accInfo = getAccountInfo(tx.accountId);
                    const runningBalance = runningBalanceMap[tx.id];

                    return (
                      <div
                        key={tx.id}
                        onClick={() => {
                          playTapSound();
                          setSelectedTransactionForDetail(tx);
                        }}
                        className="group relative bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-stone-200/70 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.07)] hover:border-stone-300 transition-all duration-200 cursor-pointer"
                        title="แตะเพื่อดูสเตตเมนต์/ทรานสคริปต์ฉบับเต็ม"
                      >
                        <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3">
                          {/* Left: Icon & Details */}
                          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                            {/* Category Squircle Icon */}
                            <div
                              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-105 duration-200 mt-0.5 sm:mt-0 ${
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
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-normal break-words">
                                  {tx.category}
                                </h4>

                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-bold tracking-wide flex-shrink-0 leading-normal ${
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
                                    className="w-6 h-6 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors"
                                    title="แตะเพื่อฟังเสียง"
                                    aria-label="ฟังเสียง"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Note (if available) */}
                              {tx.note && (
                                <p className="text-xs sm:text-sm text-stone-600 font-normal mt-0.5 break-words line-clamp-2 leading-relaxed">
                                  {tx.note}
                                </p>
                              )}

                              {/* Meta: Time, Account, Slip Photo */}
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-400 mt-1 font-medium flex-wrap leading-normal">
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
                                      <Camera className="w-3.5 h-3.5" />
                                      <span>ดูสลิป</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Amount, Running Balance & Actions */}
                          <div className="flex flex-col items-end flex-shrink-0 text-right ml-auto">
                            {/* Transaction Amount */}
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-lg sm:text-xl lg:text-2xl font-bold font-['Prompt'] tracking-tight leading-normal ${
                                  isExpense ? 'text-[#E11D48]' : 'text-[#059669]'
                                }`}
                              >
                                {isExpense ? '- ' : '+ '}฿{formatCurrency(tx.amount)}
                              </span>
                              <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
                            </div>

                            {/* Running Balance */}
                            <span className="text-xs sm:text-sm font-semibold text-stone-500 font-['Prompt'] mt-0.5 leading-normal">
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
                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="แก้ไขรายการนี้"
                                aria-label="แก้ไข"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playTapSound();
                                  setItemToDelete(tx);
                                }}
                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="ลบรายการนี้"
                                aria-label="ลบ"
                              >
                                <Trash2 className="w-4 h-4" />
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

      {/* 1. Transaction Detail & Full Statement Modal */}
      {selectedTransactionForDetail && (
        <TransactionDetailModal
          isOpen={!!selectedTransactionForDetail}
          transaction={selectedTransactionForDetail}
          runningBalance={runningBalanceMap[selectedTransactionForDetail.id]}
          onClose={() => setSelectedTransactionForDetail(null)}
          onEdit={(tx) => {
            setSelectedTransactionForDetail(null);
            onEdit(tx);
          }}
          onDelete={(tx) => {
            setSelectedTransactionForDetail(null);
            setItemToDelete(tx);
          }}
          soundEnabled={soundEnabled}
          currentBookName={currentBookName}
          accountInfo={getAccountInfo(selectedTransactionForDetail.accountId)}
        />
      )}

      {/* 2. Confirmation Modal for Deletion */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-fade">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-stone-200 shadow-2xl text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-[#E11D48] flex items-center justify-center mx-auto text-xl ring-1 ring-rose-200">
              ⚠️
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-normal">
              ยืนยันการลบรายการ
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              ต้องการลบรายการ "{itemToDelete.category}" ยอด ฿{formatCurrency(itemToDelete.amount)} ใช่ไหมครับ?
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="btn-tactile flex-1 py-2.5 min-h-[42px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                className="btn-tactile flex-1 py-2.5 min-h-[42px] rounded-2xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Full-Screen Receipt / Slip Viewer Modal */}
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
