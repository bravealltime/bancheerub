import React, { useState } from 'react';
import { Trash2, Edit3, Volume2, Search } from 'lucide-react';
import { formatThaiDateHeader, formatCurrency } from '../utils/thaiDate';
import { playTapSound, playDeleteSound, speakThai } from '../utils/audio';

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
  soundEnabled,
  accounts = [],
  activeAccountId = 'all'
}) {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchNote = (tx.note || '').toLowerCase().includes(q);
      if (!matchCat && !matchNote) return false;
    }
    return true;
  });

  const groupedByDate = filteredTransactions.reduce((acc, tx) => {
    const d = tx.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(tx);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const handleSpeakItem = (tx) => {
    playTapSound();
    const typeWord = tx.type === 'expense' ? 'รายจ่าย' : 'รายรับ';
    const speech = `${typeWord} ${tx.category} ยอด ${Math.round(tx.amount)} บาท ${tx.note ? 'หมายเหตุ ' + tx.note : ''}`;
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3">
        <h3 className="text-base sm:text-lg font-bold text-stone-900">
          ประวัติรายการ
        </h3>

        {/* Filter Pills */}
        <div className="grid grid-cols-3 bg-[#EBE7DF] p-1 rounded-xl gap-1 w-full sm:w-auto">
          <button
            onClick={() => {
              playTapSound();
              setFilterType('all');
            }}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer truncate ${
              filterType === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => {
              playTapSound();
              setFilterType('expense');
            }}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer truncate ${
              filterType === 'expense'
                ? 'bg-[#BA3C2A] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#BA3C2A]'
            }`}
          >
            รายจ่าย
          </button>
          <button
            onClick={() => {
              playTapSound();
              setFilterType('income');
            }}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer truncate ${
              filterType === 'income'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#2D6A4F]'
            }`}
          >
            รายรับ
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
            placeholder="ค้นหารายการ..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-stone-500"
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
        <div className="bg-white rounded-2xl p-6 text-center border border-stone-200 shadow-xs my-3">
          <p className="text-sm font-semibold text-stone-700">ยังไม่มีรายการในกระเป๋านี้</p>
          <p className="text-xs text-stone-500 mt-1">
            กดปุ่ม "จดรายจ่าย" หรือ "จดรายรับ" ด้านบนเพื่อเริ่มบันทึกได้เลยครับ
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {sortedDates.map((dateStr) => {
            const dateItems = groupedByDate[dateStr];
            
            const dayIncome = dateItems
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0);
            const dayExpense = dateItems
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0);

            return (
              <div key={dateStr} className="space-y-1.5 sm:space-y-2">
                {/* Date Header */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#EFECE6] border border-stone-200 px-3 py-1 rounded-xl text-stone-700">
                  <span className="font-bold text-xs truncate">
                    {formatThaiDateHeader(dateStr)}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold flex-shrink-0">
                    {dayIncome > 0 && (
                      <span className="text-[#2D6A4F]">+฿{formatCurrency(dayIncome)}</span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-[#BA3C2A]">-฿{formatCurrency(dayExpense)}</span>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                  {dateItems.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const accInfo = getAccountInfo(tx.accountId);

                    return (
                      <div
                        key={tx.id}
                        className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-stone-200 flex items-center justify-between gap-2 shadow-xs hover:border-stone-300 transition-colors w-full overflow-hidden"
                      >
                        {/* Left: Icon & Info */}
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                            isExpense ? 'bg-[#FDF2F0] text-[#BA3C2A]' : 'bg-[#EDF5F0] text-[#2D6A4F]'
                          }`}>
                            {tx.categoryIcon || (isExpense ? '🛒' : '💰')}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <h4 className="text-sm sm:text-base font-bold text-stone-900 truncate">
                                {tx.category}
                              </h4>
                              {soundEnabled && (
                                <button
                                  onClick={() => handleSpeakItem(tx)}
                                  className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer flex-shrink-0"
                                  title="กดเพื่อฟังเสียง"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            
                            {tx.note && (
                              <p className="text-xs text-stone-500 font-normal truncate">
                                {tx.note}
                              </p>
                            )}

                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-stone-400 mt-0.5">
                              {tx.time && <span>{tx.time} น.</span>}
                              
                              {/* Account badge if viewing all accounts */}
                              {activeAccountId === 'all' && (
                                <span className="px-1.5 py-0.2 rounded bg-stone-100 border border-stone-200 text-stone-600 font-medium">
                                  {accInfo.icon} {accInfo.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-base sm:text-lg font-bold font-['Prompt'] whitespace-nowrap ${
                            isExpense ? 'text-[#BA3C2A]' : 'text-[#2D6A4F]'
                          }`}>
                            {isExpense ? '-' : '+'}฿{formatCurrency(tx.amount)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                playTapSound();
                                onEdit(tx);
                              }}
                              className="btn-tactile p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 cursor-pointer"
                              title="แก้ไขรายการ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                playTapSound();
                                setItemToDelete(tx);
                              }}
                              className="btn-tactile p-1 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-600 border border-stone-200 cursor-pointer"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 max-w-sm w-full border border-stone-300 shadow-xl text-center space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              ยืนยันการลบรายการ
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm text-wrap-safe">
              ต้องการลบ "{itemToDelete.category}" ยอด {formatCurrency(itemToDelete.amount)} บาท ใช่ไหมครับ?
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setItemToDelete(null)}
                className="btn-tactile flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                className="btn-tactile flex-1 py-2 rounded-xl bg-[#BA3C2A] text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
              >
                ลบรายการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
