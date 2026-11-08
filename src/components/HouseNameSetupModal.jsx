import React, { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { playTapSound, playSuccessSound, speakThai } from '../utils/audio';

const QUICK_PRESETS = [
  '🏡 บ้านสุขใจ',
  '👵👴 บ้านคุณตาคุณยาย',
  '👨‍👩‍👧 บ้านครอบครัวเรา',
  '🌳 บ้านสวนสุขสมบูรณ์',
  '✨ บ้านใจดี'
];

export default function HouseNameSetupModal({
  isOpen,
  currentHouseId,
  currentHouseName,
  onSaveName,
  onSkip,
  soundEnabled = true
}) {
  const [nameInput, setNameInput] = useState(() => {
    // If name is just default like "บ้าน HOME-1234" or "บ้านครอบครัว (หลัก)", prefill friendly suggestion
    if (!currentHouseName || currentHouseName.startsWith('บ้าน HOME-') || currentHouseName.includes('(หลัก)')) {
      return '';
    }
    return currentHouseName;
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const finalName = nameInput.trim() || currentHouseName || `บ้าน ${currentHouseId}`;
    playSuccessSound();
    if (soundEnabled) {
      speakThai(`ตั้งชื่อบ้านเป็น ${finalName} เรียบร้อยแล้วครับ`);
    }
    onSaveName(finalName);
  };

  const handleSelectPreset = (preset) => {
    playTapSound();
    setNameInput(preset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3.5 sm:p-4 no-print animate-fade overflow-y-auto">
      <div
        className="w-full max-w-lg bg-white rounded-3xl border-2 border-amber-300 shadow-2xl overflow-hidden flex flex-col my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#1C2D27] via-[#243B33] to-[#1C2D27] text-white p-5 sm:p-6 text-center space-y-2 relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 border-2 border-emerald-400/30 flex items-center justify-center text-3xl sm:text-4xl mx-auto shadow-inner">
            🏡
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>เริ่มต้นใช้งานสมุดเงินทอง</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Prompt']">
            ตั้งชื่อบ้านครอบครัวของคุณ
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-sm mx-auto leading-relaxed">
            ตั้งชื่อบ้านให้คนในครอบครัวจำได้ง่าย ไม่สับสนกับบ้านอื่น
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Active House Code Banner */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg shrink-0">🔑</span>
              <div className="min-w-0 text-left">
                <span className="text-[11px] font-semibold text-amber-800 block">
                  รหัสบ้านของคุณในระบบ:
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-stone-900 select-all">
                  {currentHouseId}
                </span>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs text-amber-700 font-medium px-2 py-0.5 rounded-full bg-white border border-amber-200 shrink-0">
              ระบบสร้างให้อัตโนมัติ
            </span>
          </div>

          {/* Name Input */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs sm:text-sm font-bold text-stone-900">
              พิมพ์ชื่อบ้านที่คุณต้องการ:
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="เช่น บ้านสุขใจ, บ้านสวนคุณตา, บ้านน้องออย"
              className="w-full px-4 py-3 text-base sm:text-lg font-bold rounded-2xl border-2 border-stone-300 focus:border-emerald-600 focus:outline-hidden bg-white text-stone-900 transition-colors shadow-2xs"
              autoFocus
              maxLength={40}
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5 text-left">
            <span className="text-[11px] sm:text-xs font-semibold text-stone-500 block">
              หรือเลือกชื่อที่เตรียมไว้ให้แตะได้เลย:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`btn-tactile px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    nameInput === preset
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="btn-tactile w-full py-3.5 px-4 rounded-2xl bg-[#2D6A4F] hover:bg-[#23533E] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>บันทึกชื่อบ้านและเริ่มใช้งาน</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTapSound();
                onSkip();
              }}
              className="w-full py-2 text-xs sm:text-sm font-semibold text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
            >
              ข้ามไปก่อน (ใช้ชื่อชั่วคราวและเปลี่ยนภายหลังได้)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
