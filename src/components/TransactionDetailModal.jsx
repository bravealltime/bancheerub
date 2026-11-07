import React, { useState } from 'react';
import { X, Volume2, Edit3, Trash2, Camera, Calendar, Clock, BookOpen, Wallet, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatBaht, formatThaiDateFull } from '../utils/thaiDate';
import { playTapSound, speakThai } from '../utils/audio';

export default function TransactionDetailModal({
  isOpen,
  transaction,
  runningBalance,
  onClose,
  onEdit,
  onDelete,
  soundEnabled,
  currentBookName = 'ครอบครัว',
  accountInfo = { name: 'เงินบ้าน', icon: '🏠' }
}) {
  const [viewingImage, setViewingImage] = useState(false);

  if (!isOpen || !transaction) return null;

  const isExpense = transaction.type === 'expense';
  const fullDateText = formatThaiDateFull(transaction.date);

  const handleSpeak = () => {
    playTapSound();
    const typeWord = isExpense ? 'รายจ่าย' : 'รายรับ';
    let speech = `${typeWord} ${transaction.category} จำนวนเงิน ${Math.round(transaction.amount)} บาท`;
    if (transaction.note) {
      speech += ` หมายเหตุ ${transaction.note}`;
    }
    if (typeof runningBalance === 'number') {
      speech += ` ยอดคงเหลือสะสมสุทธิ ${Math.round(runningBalance)} บาทครับ`;
    }
    speakThai(speech);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print animate-fade"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-enter-rise"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-100 bg-[#FAF8F5] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">🧾</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-normal truncate">
                รายละเอียดรายการบันทึก
              </h2>
              <p className="text-xs text-stone-500 leading-normal truncate">
                สเตตเมนต์และข้อมูลอย่างละเอียด
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center cursor-pointer transition-colors"
            aria-label="ปิด"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Main Hero Card: Icon + Category + Amount */}
          <div
            className={`p-4 sm:p-5 rounded-3xl text-center space-y-2 border transition-all ${
              isExpense
                ? 'bg-rose-50/50 border-rose-200/80'
                : 'bg-emerald-50/50 border-emerald-200/80'
            }`}
          >
            {/* Category Squircle Icon */}
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-3xl flex items-center justify-center text-3xl sm:text-4xl shadow-xs ${
                isExpense
                  ? 'bg-rose-100/90 text-rose-700 ring-2 ring-rose-300/50'
                  : 'bg-emerald-100/90 text-emerald-700 ring-2 ring-emerald-300/50'
              }`}
            >
              {transaction.categoryIcon || (isExpense ? '🛒' : '💰')}
            </div>

            {/* Category Name & Badge */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                {isExpense ? (
                  <span className="bg-rose-200/80 text-rose-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                    รายจ่าย (เงินออก)
                  </span>
                ) : (
                  <span className="bg-emerald-200/80 text-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                    รายรับ (เงินเข้า)
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 leading-normal break-words">
                {transaction.category}
              </h3>
            </div>

            {/* Amount */}
            <div className="pt-1">
              <span
                className={`text-3xl sm:text-4xl font-extrabold font-['Prompt'] tracking-tight ${
                  isExpense ? 'text-[#E11D48]' : 'text-[#059669]'
                }`}
              >
                {isExpense ? '- ' : '+ '}฿{formatCurrency(transaction.amount)}
              </span>
              <span className="text-xs text-stone-500 font-semibold ml-1.5">บาท</span>
            </div>

            {/* Running Balance Badge */}
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-stone-200/90 text-xs sm:text-sm font-semibold text-stone-700 shadow-2xs">
                <span className="text-stone-500">ยอดคงเหลือสะสม ณ รายการนี้:</span>
                <span className="font-bold font-['Prompt'] text-stone-900">
                  {formatBaht(runningBalance ?? 0)}
                </span>
              </span>
            </div>
          </div>

          {/* Detailed Statement Table */}
          <div className="bg-[#FAF8F5] rounded-2xl p-3.5 sm:p-4 border border-stone-200 space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-start justify-between gap-2 py-1 border-b border-stone-200/70">
              <span className="text-stone-500 flex items-center gap-1.5 shrink-0">
                <Calendar className="w-4 h-4 text-stone-400" /> วันที่ทำรายการ:
              </span>
              <span className="font-bold text-stone-800 text-right">{fullDateText}</span>
            </div>

            {transaction.time && (
              <div className="flex items-center justify-between gap-2 py-1 border-b border-stone-200/70">
                <span className="text-stone-500 flex items-center gap-1.5 shrink-0">
                  <Clock className="w-4 h-4 text-stone-400" /> เวลา:
                </span>
                <span className="font-bold text-stone-800 text-right">{transaction.time} น.</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 py-1 border-b border-stone-200/70">
              <span className="text-stone-500 flex items-center gap-1.5 shrink-0">
                <BookOpen className="w-4 h-4 text-stone-400" /> สมุดของ:
              </span>
              <span className="font-bold text-stone-800 text-right">สมุดของ {currentBookName}</span>
            </div>

            <div className="flex items-center justify-between gap-2 py-1 border-b border-stone-200/70">
              <span className="text-stone-500 flex items-center gap-1.5 shrink-0">
                <Wallet className="w-4 h-4 text-stone-400" /> บัญชีเงิน:
              </span>
              <span className="font-bold text-stone-800 text-right">
                {accountInfo.icon} {accountInfo.name}
              </span>
            </div>

            {transaction.note && (
              <div className="py-1">
                <span className="text-stone-500 flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-stone-400" /> บันทึกย่อ / หมายเหตุ:
                </span>
                <p className="bg-white p-2.5 rounded-xl border border-stone-200 text-stone-800 font-medium leading-relaxed break-words">
                  {transaction.note}
                </p>
              </div>
            )}
          </div>

          {/* Photo Slip / Receipt Section */}
          {transaction.image && (
            <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-stone-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-700" /> รูปสลิปหรือใบเสร็จที่แนบ:
                </span>
                <button
                  type="button"
                  onClick={() => setViewingImage(true)}
                  className="text-xs text-amber-800 font-bold underline cursor-pointer"
                >
                  แตะเพื่อดูรูปใหญ่
                </button>
              </div>

              <div
                onClick={() => setViewingImage(true)}
                className="relative rounded-2xl overflow-hidden border border-stone-300 max-h-56 flex items-center justify-center bg-black/5 cursor-pointer group"
              >
                <img
                  src={transaction.image}
                  alt="สลิปหรือใบเสร็จ"
                  className="max-h-56 w-auto object-contain transition-transform group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                  <span className="px-3 py-1.5 rounded-xl bg-black/60 text-white text-xs font-bold backdrop-blur-xs">
                    🔍 แตะเพื่อดูรูปขนาดเต็ม
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sound Readout Button */}
          {soundEnabled && (
            <button
              onClick={handleSpeak}
              className="btn-tactile w-full py-2.5 px-3 min-h-[42px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-stone-200 cursor-pointer transition-colors"
            >
              <Volume2 className="w-4 h-4 text-stone-600" />
              <span>แตะเพื่อฟังเสียงอ่านรายละเอียดรายการนี้</span>
            </button>
          )}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="p-3.5 sm:p-4 bg-[#FAF8F5] border-t border-stone-200 flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              playTapSound();
              onClose();
              onEdit(transaction);
            }}
            className="btn-tactile flex-1 py-2.5 min-h-[42px] rounded-2xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Edit3 className="w-4 h-4" />
            <span>แก้ไขรายการ</span>
          </button>

          <button
            onClick={() => {
              playTapSound();
              onClose();
              onDelete(transaction);
            }}
            className="btn-tactile py-2.5 px-4 min-h-[42px] rounded-2xl bg-rose-50 hover:bg-rose-100 text-[#E11D48] border border-rose-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>ลบ</span>
          </button>
        </div>
      </div>

      {/* Full-Screen Image Lightbox */}
      {viewingImage && transaction.image && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-4 animate-fade"
          onClick={() => setViewingImage(false)}
        >
          <div className="relative max-w-2xl w-full max-h-[92vh] flex flex-col items-center">
            <button
              onClick={() => setViewingImage(false)}
              className="absolute -top-12 right-0 text-white p-2 rounded-full bg-white/20 hover:bg-white/30 cursor-pointer"
              aria-label="ปิดรูปภาพ"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={transaction.image}
              alt="รูปสลิปหรือใบเสร็จขนาดเต็ม"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
