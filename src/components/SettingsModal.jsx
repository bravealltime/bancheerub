import React, { useState, useRef } from 'react';
import { X, Check, Type, Volume2, Download, Upload, Phone, Settings2, Users, KeyRound, Shield, BookOpen } from 'lucide-react';
import { playTapSound, playDeleteSound, speakThai } from '../utils/audio';

export default function SettingsModal({
  isOpen,
  onClose,
  userName,
  onSaveUserName,
  currentBook,
  onUpdateBookPin,
  adminPin,
  onUpdateAdminPin,
  fontSize,
  onChangeFontSize,
  soundEnabled,
  onToggleSound,
  emergencyPhone,
  onSaveEmergencyPhone,
  transactions,
  onRestoreTransactions,
  onResetData,
  onOpenCategoryManager,
  onOpenTutorial,
  onSwitchBook,
  cloudStatus = 'synced',
  lastSyncTime,
  onForceSync
}) {
  const [nameInput, setNameInput] = useState(userName || 'คุณตา');
  const [phoneInput, setPhoneInput] = useState(emergencyPhone || '');
  const [pinInput, setPinInput] = useState(currentBook?.pin || '1234');
  const [adminPinInput, setAdminPinInput] = useState(adminPin || '9999');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    playTapSound();
    try {
      const dataToSave = {
        version: '2.1',
        exportedAt: new Date().toISOString(),
        userName: nameInput,
        emergencyPhone: phoneInput,
        transactions: transactions
      };

      const jsonStr = JSON.stringify(dataToSave, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `สมุดเงินทอง-สำรองข้อมูล-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (soundEnabled) {
        speakThai('ดาวน์โหลดไฟล์สำรองข้อมูลเรียบร้อยแล้วครับ');
      }
      alert('บันทึกไฟล์สำรองข้อมูลลงเครื่องเรียบร้อยแล้วครับ');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการสำรองข้อมูล: ' + err.message);
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed && Array.isArray(parsed.transactions)) {
          onRestoreTransactions(parsed.transactions);
          if (parsed.userName) {
            onSaveUserName(parsed.userName);
            setNameInput(parsed.userName);
          }
          if (parsed.emergencyPhone) {
            onSaveEmergencyPhone(parsed.emergencyPhone);
            setPhoneInput(parsed.emergencyPhone);
          }
          playTapSound();
          if (soundEnabled) {
            speakThai('กู้คืนข้อมูลเดิมเรียบร้อยแล้วครับ');
          }
          alert(`กู้คืนข้อมูลสำเร็จ (${parsed.transactions.length} รายการ)`);
        } else {
          alert('รูปแบบไฟล์ไม่ถูกต้อง');
        }
      } catch {
        alert('ไม่สามารถอ่านไฟล์ได้');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveSettings = () => {
    playTapSound();
    onSaveUserName(nameInput.trim() || 'คุณตาคุณยาย');
    onSaveEmergencyPhone(phoneInput.trim());

    // Save PIN
    if (pinInput.trim().length === 4) {
      onUpdateBookPin(pinInput.trim());
    }
    if (adminPinInput.trim().length === 4) {
      onUpdateAdminPin(adminPinInput.trim());
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 overflow-y-auto no-print">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-[#2D3A34] text-white flex items-center justify-between gap-2 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold truncate">
              ตั้งค่า
            </h2>
            <p className="text-xs text-stone-300 truncate">
              รหัส PIN ตัวหนังสือ เสียงพูด และข้อมูลสำรอง
            </p>
          </div>

          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer flex-shrink-0"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4">
          
          {/* Switch Book Button */}
          <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-stone-200 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs sm:text-sm truncate">
                <Users className="w-4 h-4 text-stone-600 flex-shrink-0" />
                <span className="truncate">สลับไปหน้าเลือกสมุดของคนในบ้าน</span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 truncate">
                เปลี่ยนไปดูสมุดของคุณตา คุณยาย หรือคนอื่น
              </p>
            </div>

            <button
              onClick={() => {
                playTapSound();
                onClose();
                onSwitchBook();
              }}
              className="btn-tactile px-3 py-1.5 rounded-xl bg-stone-800 text-white font-semibold text-xs cursor-pointer flex-shrink-0"
            >
              สลับสมุด
            </button>
          </div>

          {/* Tutorial Guide Revisit Button */}
          {onOpenTutorial && (
            <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-stone-200 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs sm:text-sm truncate">
                  <BookOpen className="w-4 h-4 text-stone-600 flex-shrink-0" />
                  <span className="truncate">คู่มือแนะนำวิธีใช้งาน</span>
                </div>
                <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 truncate">
                  ดูขั้นตอนการใช้งานอย่างละเอียดอีกครั้ง
                </p>
              </div>

              <button
                onClick={() => {
                  playTapSound();
                  onClose();
                  onOpenTutorial();
                }}
                className="btn-tactile px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold text-xs cursor-pointer flex-shrink-0"
              >
                เปิดคู่มือ
              </button>
            </div>
          )}

          {/* PIN Security Settings */}
          <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs sm:text-sm">
              <KeyRound className="w-4 h-4 text-stone-600" />
              <span>รหัส PIN ความปลอดภัย (4 ตัว):</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  รหัสของสมุดนี้ ({currentBook?.name}):
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-sm font-['Prompt'] bg-white focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1 text-[#2D6A4F]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>รหัสแอดมิน:</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-sm font-['Prompt'] bg-white focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-stone-400">
              * รหัสแอดมินสามารถใช้ปลดล็อคเข้าดูสมุดของทุกคนในบ้านได้ตลอดเวลา
            </p>
          </div>

          {/* 1. Font Size */}
          <div className="bg-[#FAF9F5] p-2.5 sm:p-3 rounded-2xl border border-stone-200">
            <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-2 flex items-center gap-1.5 truncate">
              <Type className="w-4 h-4 text-stone-600 flex-shrink-0" />
              <span>ขนาดตัวหนังสือ (สำหรับผู้สูงวัย):</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  playTapSound();
                  onChangeFontSize('normal');
                  if (soundEnabled) speakThai('ปรับขนาดตัวหนังสือเป็นขนาดปกติครับ');
                }}
                className={`btn-tactile py-2.5 px-2 min-h-[44px] rounded-xl border text-center transition-all cursor-pointer min-w-0 ${
                  fontSize === 'normal'
                    ? 'bg-stone-800 border-stone-900 text-white font-bold shadow-xs'
                    : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold leading-normal">ปกติ (A)</div>
              </button>

              <button
                onClick={() => {
                  playTapSound();
                  onChangeFontSize('large');
                  if (soundEnabled) speakThai('ปรับขนาดตัวหนังสือเป็นตัวโตแล้วครับ');
                }}
                className={`btn-tactile py-2.5 px-2 min-h-[44px] rounded-xl border text-center transition-all cursor-pointer min-w-0 ${
                  fontSize === 'large'
                    ? 'bg-amber-600 border-amber-700 text-white font-bold shadow-xs'
                    : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold leading-normal">ตัวโต (A+)</div>
              </button>

              <button
                onClick={() => {
                  playTapSound();
                  onChangeFontSize('huge');
                  if (soundEnabled) speakThai('ปรับขนาดตัวหนังสือเป็นขนาดโตที่สุดแล้วครับ');
                }}
                className={`btn-tactile py-2.5 px-2 min-h-[44px] rounded-xl border text-center transition-all cursor-pointer min-w-0 ${
                  fontSize === 'huge'
                    ? 'bg-amber-500 border-amber-600 text-white font-bold shadow-xs'
                    : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold leading-normal">โตสุด (A++)</div>
              </button>
            </div>
          </div>

          {/* 2. Manage Categories */}
          <div className="bg-[#FAF9F5] p-2.5 sm:p-3 rounded-2xl border border-stone-200 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs sm:text-sm truncate">
                <Settings2 className="w-4 h-4 text-stone-600 flex-shrink-0" />
                <span className="truncate">จัดการหมวดหมู่รายรับ-รายจ่าย</span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 truncate">
                เพิ่มหมวดใหม่ หรือลบหมวดที่ไม่ได้ใช้ออก
              </p>
            </div>

            <button
              onClick={() => {
                playTapSound();
                onOpenCategoryManager();
              }}
              className="btn-tactile px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold text-xs cursor-pointer flex-shrink-0"
            >
              แก้ไขหมวด
            </button>
          </div>

          {/* 3. Sound */}
          <div className="bg-[#FAF9F5] p-2.5 sm:p-3 rounded-2xl border border-stone-200 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs sm:text-sm truncate">
                <Volume2 className="w-4 h-4 text-stone-600 flex-shrink-0" />
                <span className="truncate">เสียงอ่านภาษาไทย</span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 truncate">
                อ่านออกเสียงเมื่อบันทึกเสร็จ
              </p>
            </div>

            <button
              onClick={() => {
                playTapSound();
                onToggleSound();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer flex-shrink-0 ${
                soundEnabled ? 'bg-[#2D6A4F]' : 'bg-stone-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* 4. Contact Phone */}
          <div className="bg-[#FAF9F5] p-2.5 sm:p-3 rounded-2xl border border-stone-200">
            <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1 flex items-center gap-1.5 truncate">
              <Phone className="w-3.5 h-3.5 text-stone-600 flex-shrink-0" />
              <span className="truncate">เบอร์โทรลูกหลาน / คนดูแล:</span>
            </label>
            <div className="flex gap-1.5 mt-1">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="เช่น 0812345678"
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white focus:outline-none focus:border-stone-500 min-w-0"
              />
              {phoneInput && (
                <a
                  href={`tel:${phoneInput}`}
                  className="btn-tactile px-3 py-1.5 rounded-xl bg-[#2D6A4F] text-white font-semibold text-xs flex items-center gap-1 flex-shrink-0"
                >
                  <Phone className="w-3 h-3" />
                  <span>โทร</span>
                </a>
              )}
            </div>
          </div>

          {/* Connected App: HomeSpace */}
          <a
            href="https://homespace-rose.vercel.app"
            target="_top"
            rel="noopener noreferrer"
            className="btn-tactile p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-between transition-colors block"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🏡</span>
              <div>
                <p className="text-xs sm:text-sm font-bold text-emerald-950">เปิด HomeSpace บ้านของเรา</p>
                <p className="text-[10px] sm:text-xs text-emerald-700">กระดานครอบครัว, คะแนนงานบ้าน, ปฏิทิน</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-white/80 px-2 py-1 rounded-lg border border-emerald-200">
              ไปที่แอป →
            </span>
          </a>

          {/* Cloud Synchronization Card */}
          <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">☁️</span>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                    ระบบ Cloud Sync ครอบครัว (Supabase)
                  </h4>
                  <p className="text-[10px] sm:text-xs text-stone-500 truncate">
                    ซิงก์ข้อมูลอัตโนมัติกับ HomeSpace บ้านของเรา
                  </p>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                cloudStatus === 'synced' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                cloudStatus === 'syncing' ? 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse' :
                'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {cloudStatus === 'synced' ? 'เชื่อมต่อแล้ว 🟢' : cloudStatus === 'syncing' ? 'กำลังซิงก์ 🔄' : 'ออฟไลน์ 🟡'}
              </span>
            </div>

            <div className="pt-1 flex items-center justify-between gap-2 text-xs border-t border-stone-200/60">
              <span className="text-[10px] sm:text-[11px] text-stone-500 truncate">
                {lastSyncTime ? `ซิงก์ล่าสุด: ${lastSyncTime.toLocaleTimeString('th-TH')}` : 'ซิงก์อัตโนมัติแบบ Real-time'}
              </span>
              <button
                type="button"
                onClick={onForceSync}
                className="btn-tactile px-3 py-1 rounded-xl bg-white border border-stone-300 hover:border-emerald-500 text-stone-800 font-bold text-xs cursor-pointer shadow-xs shrink-0"
              >
                กดซิงก์ทันที 🔄
              </button>
            </div>
          </div>

          {/* 5. Backup & Restore */}
          <div className="bg-[#FAF9F5] p-2.5 sm:p-3 rounded-2xl border border-stone-200 space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-stone-800 truncate">
              สำรองและกู้คืนข้อมูล:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleExportBackup}
                className="btn-tactile p-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer min-w-0 truncate"
              >
                <Download className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">ดาวน์โหลดสำรอง</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-tactile p-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer min-w-0 truncate"
              >
                <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">กู้คืนข้อมูล</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          {/* 6. Clear Data */}
          <div className="pt-1 text-center">
            {!showConfirmReset ? (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="text-xs text-stone-400 hover:text-red-600 underline cursor-pointer"
              >
                ล้างข้อมูลทั้งหมด
              </button>
            ) : (
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 space-y-2">
                <p className="text-xs font-semibold text-red-800 text-wrap-safe">
                  ต้องการลบข้อมูลทั้งหมดใช่ไหมครับ?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 py-1 rounded-lg bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => {
                      playDeleteSound();
                      onResetData();
                      setShowConfirmReset(false);
                      onClose();
                    }}
                    className="flex-1 py-1 rounded-lg bg-[#BA3C2A] text-white text-xs font-semibold cursor-pointer"
                  >
                    ยืนยันลบ
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Save Bar */}
        <div className="p-2.5 sm:p-3 bg-[#FAF9F5] border-t border-stone-200 flex-shrink-0">
          <button
            onClick={handleSaveSettings}
            className="btn-tactile w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>บันทึกการตั้งค่า</span>
          </button>
        </div>
      </div>
    </div>
  );
}
