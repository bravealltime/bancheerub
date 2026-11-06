import React, { useState } from 'react';
import { X, Check, Plus, Trash2, Bell } from 'lucide-react';
import { formatCurrency, getTodayString } from '../utils/thaiDate';
import { playTapSound, playSuccessSound } from '../utils/audio';

export default function RemindersModal({
  isOpen,
  onClose,
  reminders,
  onSaveReminders,
  completedReminders,
  onToggleCompleteReminder
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDay, setNewDay] = useState('10');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState('expense');
  const [newIcon, setNewIcon] = useState('💡');

  if (!isOpen) return null;

  const todayStr = getTodayString();
  const currentDay = parseInt(todayStr.slice(8, 10), 10) || 1;
  const currentMonthStr = todayStr.slice(0, 7); // 'YYYY-MM'

  const handleAddReminder = () => {
    if (!newTitle.trim()) {
      alert('กรุณากรอกชื่อรายการเตือนครับ');
      return;
    }
    const day = parseInt(newDay, 10);
    if (!day || day < 1 || day > 31) {
      alert('กรุณาระบุวันที่ 1 - 31 ครับ');
      return;
    }

    playSuccessSound();
    const newRem = {
      id: 'rem-' + Date.now(),
      title: newTitle.trim(),
      type: newType,
      dayOfMonth: day,
      amount: parseFloat(newAmount) || 0,
      icon: newIcon,
      note: ''
    };

    onSaveReminders([...reminders, newRem]);
    setIsAdding(false);
    setNewTitle('');
    setNewAmount('');
  };

  const handleDeleteReminder = (id) => {
    playTapSound();
    onSaveReminders(reminders.filter(r => r.id !== id));
  };

  const calculateDaysLeft = (dayOfMonth) => {
    const diff = dayOfMonth - currentDay;
    if (diff === 0) return { label: 'ครบกำหนดวันนี้!', isToday: true, isPast: false };
    if (diff > 0) return { label: `อีก ${diff} วัน`, isToday: false, isPast: false };
    return { label: `เลยมา ${Math.abs(diff)} วัน`, isToday: false, isPast: true };
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
            <h2 className="text-base sm:text-lg font-bold truncate flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-stone-300" />
              <span>เตือนบิลประจำ & วันเบี้ยคนแก่</span>
            </h2>
            <p className="text-xs text-stone-300 truncate">
              เช็ครายการที่ต้องจ่าย หรือเงินที่จะเข้าในแต่ละเดือน
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
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3">
          
          {/* Add New Button Toggle */}
          {!isAdding ? (
            <button
              onClick={() => {
                playTapSound();
                setIsAdding(true);
              }}
              className="btn-tactile w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-stone-300 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มการแจ้งเตือนใหม่</span>
            </button>
          ) : (
            <div className="bg-[#FAF9F5] p-3 rounded-xl border border-stone-300 space-y-2.5">
              <div className="text-xs font-bold text-stone-800">เพิ่มรายการเตือนใหม่</div>

              {/* Type Switch */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setNewType('expense')}
                  className={`flex-1 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                    newType === 'expense' ? 'bg-[#BA3C2A] text-white border-[#BA3C2A]' : 'bg-white text-stone-700 border-stone-300'
                  }`}
                >
                  บิลที่ต้องจ่าย
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('income')}
                  className={`flex-1 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                    newType === 'income' ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-stone-700 border-stone-300'
                  }`}
                >
                  เงินที่จะเข้า
                </button>
              </div>

              {/* Title input */}
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ชื่อรายการ เช่น ค่าไฟบ้าน, เบี้ยคนแก่"
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs sm:text-sm bg-white"
              />

              {/* Day & Amount Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-0.5">ทุกวันที่ของเดือน:</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="w-full px-2.5 py-1 rounded-lg border border-stone-300 text-xs sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-0.5">ประมาณกี่บาท:</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="เช่น 300"
                    className="w-full px-2.5 py-1 rounded-lg border border-stone-300 text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>

              {/* Emoji Icons */}
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">เลือกไอคอน:</label>
                <div className="flex gap-1.5 flex-wrap">
                  {['💡', '💧', '📱', '👴', '💊', '🏥', '🏠', '🛒', '🚗'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewIcon(emoji)}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center border cursor-pointer ${
                        newIcon === emoji ? 'bg-stone-800 border-stone-900 text-white' : 'bg-white border-stone-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-1.5 rounded-lg bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAddReminder}
                  className="flex-1 py-1.5 rounded-lg bg-[#2D6A4F] text-white text-xs font-semibold cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </div>
          )}

          {/* List of Reminders */}
          <div className="space-y-2">
            {reminders.map((rem) => {
              const status = calculateDaysLeft(rem.dayOfMonth);
              const key = `${currentMonthStr}-${rem.id}`;
              const isCompleted = !!completedReminders[key];
              const isIncome = rem.type === 'income';

              return (
                <div
                  key={rem.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    isCompleted
                      ? 'bg-stone-100 border-stone-200 opacity-60'
                      : 'bg-[#FAF9F5] border-stone-300 shadow-xs'
                  }`}
                >
                  {/* Left: Checkbox & Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => {
                        playTapSound();
                        onToggleCompleteReminder(key);
                      }}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer flex-shrink-0 ${
                        isCompleted
                          ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white'
                          : 'bg-white border-stone-400'
                      }`}
                      title={isCompleted ? 'ทำเครื่องหมายว่ายังไม่จ่าย' : 'ทำเครื่องหมายว่าจัดการแล้ว'}
                    >
                      {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base flex-shrink-0">{rem.icon}</span>
                        <span className={`text-xs sm:text-sm font-bold truncate ${
                          isCompleted ? 'line-through text-stone-500' : 'text-stone-900'
                        }`}>
                          {rem.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                        <span>ทุกวันที่ {rem.dayOfMonth}</span>
                        {rem.amount > 0 && (
                          <span className={isIncome ? 'text-[#2D6A4F] font-semibold' : 'text-[#BA3C2A] font-semibold'}>
                            (~฿{formatCurrency(rem.amount)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Due status & delete */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      isCompleted
                        ? 'bg-stone-200 text-stone-600'
                        : status.isToday
                        ? 'bg-amber-100 text-amber-800 font-bold'
                        : status.isPast
                        ? 'bg-red-50 text-red-700'
                        : 'bg-stone-200 text-stone-700'
                    }`}>
                      {isCompleted ? 'เสร็จแล้ว' : status.label}
                    </span>

                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="p-1 rounded-md text-stone-400 hover:text-red-600 cursor-pointer"
                      title="ลบรายการเตือน"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Close Button */}
        <div className="p-2.5 sm:p-3 bg-[#FAF9F5] border-t border-stone-200 flex-shrink-0">
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="btn-tactile w-full py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs sm:text-sm cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
