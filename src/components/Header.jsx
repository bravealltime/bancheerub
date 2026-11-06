import React from 'react';
import { Volume2, VolumeX, Type, Settings, Bell, ArrowLeft } from 'lucide-react';
import { formatThaiDateFull, getTodayString } from '../utils/thaiDate';
import { playTapSound } from '../utils/audio';

export default function Header({
  currentBook,
  onSwitchBook,
  soundEnabled,
  onToggleSound,
  fontSize,
  onChangeFontSize,
  onOpenSettings,
  onOpenMonthlyReport,
  onOpenReminders,
  pendingRemindersCount = 0
}) {
  const todayStr = getTodayString();
  const formattedToday = formatThaiDateFull(todayStr);

  const getFontSizeLabel = () => {
    if (fontSize === 'huge') return 'โตสุด';
    if (fontSize === 'large') return 'ตัวโต';
    return 'ปกติ';
  };

  const cycleFontSize = () => {
    playTapSound();
    if (fontSize === 'normal') onChangeFontSize('large');
    else if (fontSize === 'large') onChangeFontSize('huge');
    else onChangeFontSize('normal');
  };

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 w-full no-print">
      <div className="max-w-5xl xl:max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Switch Back Button & Current Book Name */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <button
            onClick={() => {
              playTapSound();
              onSwitchBook();
            }}
            className="btn-tactile flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold border border-stone-300 flex-shrink-0 cursor-pointer"
            title="กดเพื่อกลับไปเลือกสมุดของคนอื่น"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">สลับคน</span>
          </button>

          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-xl flex-shrink-0">{currentBook?.icon || '📒'}</span>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-stone-900 leading-tight truncate">
                สมุดของ {currentBook?.name || 'ครอบครัว'}
              </h1>
              <p className="text-[11px] text-stone-500 truncate">
                แตะ "สลับคน" เพื่อเปลี่ยนสมุด
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Link to HomeSpace */}
          <a
            href="https://homespace-rose.vercel.app"
            target="_top"
            rel="noopener noreferrer"
            title="กลับไปที่ HomeSpace บ้านของเรา"
            className="btn-tactile flex items-center gap-1 px-2.5 h-9 sm:h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <span className="text-base">🏡</span>
            <span className="hidden sm:inline">HomeSpace</span>
          </a>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              playTapSound();
              onToggleSound();
            }}
            title={soundEnabled ? 'เปิดเสียงอ่านอยู่ (แตะเพื่อปิด)' : 'ปิดเสียงอยู่ (แตะเพื่อเปิด)'}
            className={`btn-tactile flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-stone-100 border-stone-300 text-stone-800'
                : 'bg-white border-stone-200 text-stone-400'
            }`}
            aria-label="สลับเสียงพูด"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Font Size Toggle */}
          <button
            onClick={cycleFontSize}
            title="เปลี่ยนขนาดตัวหนังสือ"
            className="btn-tactile flex items-center justify-center gap-0.5 px-2 h-9 sm:h-10 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs sm:text-sm cursor-pointer"
            aria-label="เปลี่ยนขนาดตัวอักษร"
          >
            <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
            <span className="whitespace-nowrap">{getFontSizeLabel()}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              playTapSound();
              onOpenSettings();
            }}
            title="ตั้งค่าเพิ่มเติม"
            className="btn-tactile flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-100 border border-stone-300 text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="เปิดหน้าตั้งค่า"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Date & Reminders Banner */}
      <div className="max-w-5xl xl:max-w-6xl mx-auto mt-2 pt-1.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-xs text-stone-500 font-medium">
        <span className="truncate">{formattedToday}</span>
        
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => {
              playTapSound();
              onOpenReminders();
            }}
            className="text-stone-700 font-semibold hover:text-stone-900 flex items-center gap-1 cursor-pointer"
          >
            <Bell className="w-3 h-3 text-stone-500" />
            <span>เตือนบิล</span>
            {pendingRemindersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#BA3C2A] text-white text-[9px] font-bold flex items-center justify-center">
                {pendingRemindersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              playTapSound();
              onOpenMonthlyReport();
            }}
            className="text-stone-700 font-semibold hover:text-stone-900 underline cursor-pointer"
          >
            ดูสรุปรายเดือน
          </button>
        </div>
      </div>
    </header>
  );
}
