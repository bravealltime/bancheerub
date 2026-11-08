import React, { useState } from 'react';
import { Plus, Trash2, Lock, X } from 'lucide-react';
import { playTapSound, playDeleteSound, playSuccessSound } from '../utils/audio';

const ROLE_EMOJIS = ['👴', '👵', '👨', '👩', '👦', '👧', '👨‍👩‍👦', '🏠', '🏢', '👛', '🌾', '🐱'];

export default function ProfilePickerScreen({
  books,
  onSelectBookWithPin,
  onAddBook,
  onDeleteBook,
  cloudStatus = 'synced',
  onForceSync,
  currentHouseId,
  currentHouseName,
  onOpenHouseManager
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newIcon, setNewIcon] = useState('👴');

  const handleCreate = () => {
    if (!newName.trim()) {
      alert('กรุณาพิมพ์ชื่อคนหรือชื่อสมุดครับ');
      return;
    }
    const pinToUse = newPin.trim() || '1234';
    if (pinToUse.length !== 4 || isNaN(pinToUse)) {
      alert('กรุณาตั้งรหัสผ่านเป็นตัวเลข 4 ตัวครับ');
      return;
    }

    playSuccessSound();
    const newBook = {
      id: 'book-' + Date.now(),
      name: newName.trim(),
      icon: newIcon,
      description: newDesc.trim() || 'สมุดเงินของ ' + newName.trim(),
      pin: pinToUse
    };

    onAddBook(newBook);
    onSelectBookWithPin(newBook);
    setNewName('');
    setNewDesc('');
    setNewPin('');
    setIsAdding(false);
  };

  const handleDelete = (e, book) => {
    e.stopPropagation();
    if (books.length <= 1) {
      alert('ต้องมีสมุดเงินเหลืออยู่อย่างน้อย 1 เล่มครับ');
      return;
    }
    if (confirm(`ต้องการลบสมุดของ "${book.name}" ใช่ไหมครับ?`)) {
      playDeleteSound();
      onDeleteBook(book.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4EF] p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center">
      <div className="max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl w-full mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="text-center space-y-2 pb-1">
          {/* Quick link back to HomeSpace, Cloud sync indicator & House Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2 pb-1">
            <a
              href="https://homespace-rose.vercel.app"
              target="_top"
              rel="noopener noreferrer"
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold border border-stone-300 shadow-xs cursor-pointer transition-all"
            >
              <span>🏡</span>
              <span>กลับสู่ HomeSpace บ้านของเรา</span>
              <span className="text-stone-400">→</span>
            </a>

            {onOpenHouseManager && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onOpenHouseManager();
                }}
                className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs cursor-pointer transition-all"
                title="แตะเพื่อสลับบ้าน หรือส่งลิงก์ชวนคนอื่นเข้าบ้านนี้"
              >
                <span>🏠</span>
                <span>{currentHouseName || 'บ้านเรา'}</span>
                {currentHouseId && (
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-200/90 text-[10px] text-amber-950 font-mono">
                    {currentHouseId}
                  </span>
                )}
                <span className="text-amber-700 text-[11px] underline">สลับ/ชวนคน</span>
              </button>
            )}

            <button
              type="button"
              onClick={onForceSync}
              className={`btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-xs cursor-pointer transition-all ${
                cloudStatus === 'synced' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                cloudStatus === 'syncing' ? 'bg-blue-50 text-blue-800 border-blue-300 animate-pulse' :
                'bg-amber-50 text-amber-800 border-amber-300'
              }`}
              title="สถานะ Cloud Sync (แตะเพื่อกดรีเฟรชซิงก์)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{cloudStatus === 'synced' ? 'ซิงก์ Cloud แล้ว 🟢' : cloudStatus === 'syncing' ? 'กำลังซิงก์... 🔄' : 'ออฟไลน์ 🟡'}</span>
            </button>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white border border-stone-300 flex items-center justify-center text-3xl mx-auto shadow-xs">
            📒
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 pt-1 font-['Prompt']">
            สมุดเงินทอง ครอบครัว
          </h1>
          <p className="text-sm sm:text-base text-stone-600 font-medium max-w-md mx-auto">
            เลือกสมุดที่ต้องการดู (ใส่รหัส PIN 4 ตัวเพื่อเข้าดู)
          </p>
        </div>

        {/* Member Profile Books Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {books.map((book) => {
            return (
              <div
                key={book.id}
                onClick={() => {
                  playTapSound();
                  onSelectBookWithPin(book);
                }}
                className="btn-tactile bg-white rounded-2xl p-4 border-2 border-stone-200 hover:border-stone-500 hover:shadow-md shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#EFECE6] border border-stone-300 flex items-center justify-center text-2xl flex-shrink-0">
                    {book.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-stone-900 truncate">
                      สมุดของ {book.name}
                    </h2>
                    <p className="text-xs text-stone-500 truncate">
                      {book.description || 'สมุดเงินส่วนตัว'}
                    </p>
                  </div>
                </div>

                {/* Right: Lock & Delete */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-100 text-stone-600 text-xs font-semibold border border-stone-200">
                    <Lock className="w-3 h-3 text-stone-500" />
                    <span>ใส่รหัส</span>
                  </div>

                  {books.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(e, book)}
                      className="p-1 rounded-xl text-stone-300 hover:text-red-600 hover:bg-stone-50 cursor-pointer"
                      title="ลบสมุดนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add New Profile Member Button */}
          {!isAdding && (
            <button
              onClick={() => {
                playTapSound();
                setIsAdding(true);
              }}
              className="btn-tactile bg-white/70 hover:bg-white rounded-2xl p-4 border-2 border-dashed border-stone-300 hover:border-stone-500 text-stone-700 font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all min-h-[76px]"
            >
              <Plus className="w-5 h-5 text-stone-600" />
              <span>+ เพิ่มสมุดใหม่</span>
            </button>
          )}
        </div>

        {/* Add New Profile Member Form */}
        {isAdding && (
          <div className="max-w-lg mx-auto bg-white rounded-2xl p-5 border-2 border-stone-300 shadow-md space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900">
                เพิ่มสมุดบัญชีใหม่
              </h3>
              <button
                onClick={() => setIsAdding(false)}
                className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                ชื่อเจ้าของสมุด:
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="เช่น คุณพ่อ, คุณแม่, ลูกสาว"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-stone-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                ตั้งรหัส PIN 4 ตัว (สำหรับเปิดดูสมุดนี้):
              </label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="ตัวเลข 4 ตัว เช่น 1234"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-['Prompt'] focus:outline-none focus:border-stone-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                คำอธิบายสั้นๆ (ถ้ามี):
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="เช่น ค่านมหลาน, เงินร้านค้า"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-stone-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                เลือกรูปตัวแทน:
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {ROLE_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewIcon(emoji)}
                    className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center border cursor-pointer ${
                      newIcon === emoji ? 'bg-stone-800 text-white border-stone-900' : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs sm:text-sm cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="flex-1 py-2 rounded-xl bg-[#2D6A4F] text-white font-bold text-xs sm:text-sm cursor-pointer"
              >
                บันทึกสมุดใหม่
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
