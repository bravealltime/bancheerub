import React, { useState } from 'react';
import { X, Lock, Delete } from 'lucide-react';
import { playTapSound, playSuccessSound, playDeleteSound, speakThai } from '../utils/audio';

export default function AdminAuthModal({
  isOpen,
  adminPin = '9999',
  onClose,
  onSuccess,
  title = 'ยืนยันสิทธิ์แอดมิน (Admin Only)',
  description = 'เฉพาะผู้ดูแลบ้านเท่านั้น กรุณากรอกรหัส PIN แอดมิน 4 ตัว เพื่อดำเนินการ'
}) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleKeyPress = (digit) => {
    playTapSound();
    if (pin.length >= 4) return;

    const newPin = pin + String(digit);
    setPin(newPin);
    setErrorMsg('');

    if (newPin.length === 4) {
      setTimeout(() => {
        if (newPin === String(adminPin)) {
          playSuccessSound();
          speakThai('ยืนยันสิทธิ์แอดมินถูกต้องครับ');
          setPin('');
          setErrorMsg('');
          onSuccess();
        } else {
          playDeleteSound();
          setErrorMsg('รหัสแอดมินไม่ถูกต้องครับ (รหัสเริ่มต้น: 9999)');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3.5 sm:p-4 no-print animate-fade">
      <div
        className="w-full max-w-xs sm:max-w-sm bg-white rounded-3xl p-5 sm:p-6 border-2 border-stone-300 shadow-2xl text-center space-y-4"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="w-6" /> {/* spacer */}
          <div className="flex items-center gap-1.5 text-stone-800 font-bold text-xs sm:text-sm">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>ความปลอดภัยระบบ</span>
          </div>
          <button
            onClick={() => {
              playTapSound();
              setPin('');
              setErrorMsg('');
              onClose();
            }}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 cursor-pointer"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Icon & Title */}
        <div className="space-y-1.5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-3xl mx-auto shadow-xs">
            👑
          </div>
          <h3 className="text-base sm:text-lg font-black text-stone-900 font-['Prompt']">
            {title}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed px-2">
            {description}
          </p>
        </div>

        {/* 4-digit PIN Visual Indicator */}
        <div className="py-2">
          <div className="flex justify-center items-center gap-3">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = index < pin.length;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all duration-150 ${
                    isFilled
                      ? 'bg-amber-600 border-amber-600 scale-110 shadow-xs'
                      : 'border-stone-300 bg-stone-100'
                  }`}
                />
              );
            })}
          </div>

          {errorMsg ? (
            <p className="text-xs font-bold text-red-600 mt-2.5 animate-bounce">
              {errorMsg}
            </p>
          ) : (
            <p className="text-[11px] text-stone-400 mt-2.5">
              ใส่รหัส PIN แอดมิน 4 ตัว
            </p>
          )}
        </div>

        {/* Numeric Keypad (Senior-friendly, tactile) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[260px] mx-auto pt-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="btn-tactile h-12 sm:h-14 rounded-2xl bg-[#FAF9F5] hover:bg-stone-200 border border-stone-200 text-stone-900 text-lg sm:text-xl font-bold font-['Prompt'] flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 transition-all"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="btn-tactile h-12 sm:h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-500 text-xs sm:text-sm font-semibold flex items-center justify-center cursor-pointer active:scale-95 transition-all"
          >
            ล้าง
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleKeyPress(0)}
            className="btn-tactile h-12 sm:h-14 rounded-2xl bg-[#FAF9F5] hover:bg-stone-200 border border-stone-200 text-stone-900 text-lg sm:text-xl font-bold font-['Prompt'] flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 transition-all"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            className="btn-tactile h-12 sm:h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            aria-label="ลบตัวเลขล่าสุด"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Hint */}
        <div className="pt-1 border-t border-stone-100 text-[11px] text-stone-400">
          <span>รหัสแอดมินตั้งต้นคือ </span>
          <span className="font-mono font-bold text-stone-600">9999</span>
        </div>
      </div>
    </div>
  );
}
