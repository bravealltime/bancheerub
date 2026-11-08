import React from 'react';
import { Volume2, VolumeX, Type, Settings, Bell, ArrowLeft, Cloud } from 'lucide-react';
import { formatThaiDateFull, getTodayString } from '../utils/thaiDate';
import { playTapSound, speakThai } from '../utils/audio';

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
  pendingRemindersCount = 0,
  cloudStatus = 'synced',
  onForceSync,
  currentHouseId,
  currentHouseName,
  isAdminMode = false,
  onOpenHouseManager
}) {
  const todayStr = getTodayString();
  const formattedToday = formatThaiDateFull(todayStr);

  const getFontSizeDisplay = () => {
    if (fontSize === 'huge') return { text: 'โตสุด', tag: 'A++', desc: 'ขนาดใหญ่พิเศษ' };
    if (fontSize === 'large') return { text: 'ตัวโต', tag: 'A+', desc: 'ขนาดตัวโต' };
    return { text: 'ปกติ', tag: 'A', desc: 'ขนาดปกติ' };
  };

  const cycleFontSize = () => {
    playTapSound();
    let next = 'normal';
    let speech = 'ปรับขนาดตัวหนังสือเป็นขนาดปกติครับ';
    if (fontSize === 'normal') {
      next = 'large';
      speech = 'ปรับขนาดตัวหนังสือเป็นตัวโตแล้วครับ';
    } else if (fontSize === 'large') {
      next = 'huge';
      speech = 'ปรับขนาดตัวหนังสือเป็นขนาดโตที่สุดแล้วครับ';
    }
    onChangeFontSize(next);
    if (soundEnabled) {
      speakThai(speech);
    }
  };

  const currentDisplay = getFontSizeDisplay();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/70 sticky top-0 z-30 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 w-full no-print">
      <div className="max-w-5xl xl:max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Switch Back Button & Current Book Name */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <button
            onClick={() => {
              playTapSound();
              onSwitchBook();
            }}
            className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] sm:min-h-[42px] rounded-2xl bg-stone-100/90 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-bold border border-stone-200 flex-shrink-0 cursor-pointer transition-colors"
            title="กดเพื่อกลับไปเลือกสมุดของคนอื่น"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">สลับคน</span>
          </button>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-2xl sm:text-3xl flex-shrink-0 leading-none">{currentBook?.icon || '📒'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-stone-900 leading-normal truncate">
                  สมุดของ {currentBook?.name || 'ครอบครัว'}
                </h1>
                {/* House Info Badge (Only admins get manage button, regular members see clean read-only tag) */}
                {isAdminMode && onOpenHouseManager ? (
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      onOpenHouseManager();
                    }}
                    className="btn-tactile inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    title="แตะเพื่อจัดการบ้าน (สิทธิ์แอดมิน)"
                  >
                    <span>🏡</span>
                    <span className="truncate max-w-[120px] font-black">{currentHouseName || 'บ้านเรา'}</span>
                    <span className="text-[10px] bg-emerald-200/90 text-emerald-900 px-1 py-0.2 rounded font-bold">
                      👑 แอดมิน
                    </span>
                  </button>
                ) : (
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold"
                    title={`บ้าน: ${currentHouseName || 'บ้านเรา'} (${currentHouseId || ''})`}
                  >
                    <span>🏡</span>
                    <span className="truncate max-w-[120px]">{currentHouseName || 'บ้านเรา'}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 truncate">
                <span className="text-stone-400 truncate">
                  กำลังใช้งาน: <strong className="text-stone-700 font-semibold">{currentHouseName}</strong>
                </span>
                <span className="text-stone-300 hidden sm:inline">•</span>
                <span className="text-stone-400 truncate hidden sm:inline">
                  แตะ "สลับคน" เพื่อเปลี่ยนสมุด
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Link to HomeSpace */}
          <a
            href="https://homespace-rose.vercel.app"
            target="_top"
            rel="noopener noreferrer"
            title="กลับไปที่ HomeSpace บ้านของเรา"
            className="btn-tactile flex items-center gap-1 px-2.5 sm:px-3 min-h-[38px] sm:min-h-[42px] rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <span className="text-base sm:text-lg">🏡</span>
            <span className="hidden md:inline">HomeSpace</span>
          </a>

          {/* Cloud Sync Status Indicator */}
          <button
            onClick={() => {
              playTapSound();
              if (onForceSync) onForceSync();
            }}
            title={
              cloudStatus === 'synced' ? 'ซิงก์กับ Cloud ของบ้านเรียบร้อยแล้ว (แตะเพื่อรีเฟรช)' :
              cloudStatus === 'syncing' ? 'กำลังซิงก์ข้อมูลกับ Cloud...' : 'ออฟไลน์: บันทึกข้อมูลในเครื่องเรียบร้อย (จะซิงก์เมื่อต่อเน็ต)'
            }
            className={`btn-tactile flex items-center gap-1.5 px-2.5 sm:px-3 min-h-[38px] sm:min-h-[42px] rounded-2xl border text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
              cloudStatus === 'synced' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              cloudStatus === 'syncing' ? 'bg-blue-50 border-blue-200 text-blue-800 animate-pulse' :
              'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <Cloud className="w-4 h-4 stroke-[2]" />
            <span className="hidden lg:inline">
              {cloudStatus === 'synced' ? 'ซิงก์แล้ว' : cloudStatus === 'syncing' ? 'กำลังซิงก์' : 'ออฟไลน์'}
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              playTapSound();
              onToggleSound();
            }}
            title={soundEnabled ? 'เปิดเสียงอ่านอยู่ (แตะเพื่อปิด)' : 'ปิดเสียงอยู่ (แตะเพื่อเปิด)'}
            className={`btn-tactile flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 min-h-[38px] sm:min-h-[42px] rounded-2xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-stone-100/90 border-stone-200 text-stone-800 shadow-2xs'
                : 'bg-white border-stone-200 text-stone-400'
            }`}
            aria-label="สลับเสียงพูด"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Font Size Toggle Button (Prominent & Clear) */}
          <button
            onClick={cycleFontSize}
            title={`แตะเพื่อเปลี่ยนขนาดตัวหนังสือ (ปัจจุบัน: ${currentDisplay.desc})`}
            className={`btn-tactile flex items-center justify-center gap-1 px-2.5 sm:px-3 min-h-[38px] sm:min-h-[42px] rounded-2xl border text-xs sm:text-sm font-bold cursor-pointer transition-all ${
              fontSize === 'huge'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : fontSize === 'large'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-stone-100/90 text-stone-800 border-stone-200 hover:bg-stone-200'
            }`}
            aria-label="เปลี่ยนขนาดตัวอักษร"
          >
            <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="whitespace-nowrap font-bold">
              {currentDisplay.text} <span className="text-[11px] font-semibold opacity-90">({currentDisplay.tag})</span>
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              playTapSound();
              onOpenSettings();
            }}
            title="ตั้งค่าเพิ่มเติม"
            className="btn-tactile flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 min-h-[38px] sm:min-h-[42px] rounded-2xl bg-stone-100/90 border border-stone-200 text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="เปิดหน้าตั้งค่า"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Date & Reminders Banner */}
      <div className="max-w-5xl xl:max-w-6xl mx-auto mt-2 pt-1.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1.5 text-xs sm:text-sm text-stone-500 font-medium">
        <div className="flex items-center gap-2 truncate">
          <span className="truncate">{formattedToday}</span>
          <span className="text-stone-300">•</span>
          <span className="text-emerald-800 font-semibold truncate flex items-center gap-1">
            <span>🏡</span>
            <span>{currentHouseName || 'บ้านครอบครัว'}</span>
          </span>
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => {
              playTapSound();
              onOpenReminders();
            }}
            className="text-stone-700 font-semibold hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-stone-500" />
            <span>เตือนบิล</span>
            {pendingRemindersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#BA3C2A] text-white text-xs font-bold leading-none">
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
