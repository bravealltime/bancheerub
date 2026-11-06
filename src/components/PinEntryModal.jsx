import React, { useState } from 'react';
import { X, Delete, Lock, ShieldCheck } from 'lucide-react';
import { playTapSound, playSuccessSound, playDeleteSound } from '../utils/audio';
import { DEFAULT_BOOKS } from '../data/defaultBooks';

export default function PinEntryModal({
  isOpen,
  book,
  adminPin,
  onClose,
  onSuccess
}) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showHint, setShowHint] = useState(false);

  if (!isOpen || !book) return null;

  // Resolve correct PIN for this book (fallback gracefully to DEFAULT_BOOKS)
  const defaultMatch = DEFAULT_BOOKS.find(db => db.id === book.id);
  const correctOwnerPin = book.pin || defaultMatch?.pin || (
    book.id === 'book-grandpa' ? '1111' :
    book.id === 'book-grandma' ? '2222' :
    book.id === 'book-home' ? '0000' :
    book.id === 'book-child' ? '3333' : '1111'
  );

  const handleKeyPress = (digit) => {
    playTapSound();
    if (pin.length >= 4) return;

    const newPin = pin + String(digit);
    setPin(newPin);
    setErrorMsg('');

    if (newPin.length === 4) {
      // Check credentials
      const isOwnerPin = newPin === correctOwnerPin;
      const isAdminPin = newPin === adminPin;

      setTimeout(() => {
        if (isOwnerPin || isAdminPin) {
          playSuccessSound();
          onSuccess(book.id, isAdminPin);
          setPin('');
        } else {
          playDeleteSound();
          setErrorMsg('รหัส PIN ไม่ถูกต้องครับ ลองใหม่อีกครั้ง');
          setPin('');
        }
      }, 200);
    }
  };

  const handleBackspace = () => {
    playTapSound();
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleClear = () => {
    playTapSound();
    setPin('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 no-print animate-fade">
      <div 
        className="w-full max-w-xs bg-white rounded-3xl p-5 border border-stone-200 shadow-2xl text-center space-y-4"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="w-6" /> {/* spacer */}
          <div className="flex items-center gap-1.5 text-stone-700 font-bold text-xs">
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <span>รหัสผ่านความปลอดภัย</span>
          </div>
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 cursor-pointer"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="space-y-1">
          <div className="w-14 h-14 rounded-2xl bg-[#EFECE6] border border-stone-300 flex items-center justify-center text-3xl mx-auto shadow-xs">
            {book.icon}
          </div>
          <h2 className="text-lg font-bold text-stone-900 pt-1">
            สมุดของ {book.name}
          </h2>
          <p className="text-xs text-stone-500">
            ใส่รหัส PIN 4 ตัว หรือรหัสแอดมินเพื่อเข้าดู
          </p>
        </div>

        {/* 4 Dots indicator */}
        <div className="flex items-center justify-center gap-3 py-1">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all ${
                  isFilled
                    ? 'bg-[#2D6A4F] scale-110 shadow-xs'
                    : 'bg-stone-200 border-2 border-stone-300'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg ? (
          <p className="text-xs font-bold text-[#BA3C2A] bg-red-50 py-1 px-2 rounded-lg">
            {errorMsg}
          </p>
        ) : (
          <div className="h-5" />
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="btn-tactile h-12 rounded-2xl bg-[#FAF9F5] border border-stone-200 hover:bg-stone-100 text-xl font-bold text-stone-800 shadow-xs flex items-center justify-center font-['Prompt'] cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="btn-tactile h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-600 flex items-center justify-center cursor-pointer"
          >
            ล้าง
          </button>
          <button
            onClick={() => handleKeyPress(0)}
            className="btn-tactile h-12 rounded-2xl bg-[#FAF9F5] border border-stone-200 hover:bg-stone-100 text-xl font-bold text-stone-800 shadow-xs flex items-center justify-center font-['Prompt'] cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="btn-tactile h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-xs gap-1 cursor-pointer"
            aria-label="ลบตัวเลข"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Admin and PIN Hint Drawer */}
        <div className="pt-1 text-[11px] text-stone-400 border-t border-stone-100 space-y-1">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-stone-500 underline font-medium cursor-pointer"
          >
            {showHint ? 'ซ่อนคำใบ้รหัส' : 'ดูคำใบ้รหัสเริ่มต้น / แอดมิน'}
          </button>

          {showHint && (
            <div className="p-2 bg-stone-50 rounded-xl border border-stone-200 text-stone-600 text-left space-y-1">
              <p>• รหัสของ {book.name}: <strong>{correctOwnerPin}</strong></p>
              <p className="flex items-center gap-1 text-[#2D6A4F] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>รหัสแอดมิน (เข้าได้ทุกบัญชี): {adminPin}</span>
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
