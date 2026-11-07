import React, { useState } from 'react';
import { X, Plus, Trash2, RotateCcw } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/defaultCategories';
import { playTapSound, playSuccessSound } from '../utils/audio';

const AVAILABLE_EMOJIS = [
  '🍲', '🛒', '💊', '💡', '🙏', '🎁', '🚗', '🏡', '👕', '📦',
  '👴', '👨‍👩‍👦', '💰', '🌾', '🏦', '🧧', '✨', '🐱', '🐶', '🌿',
  '☕', '🧁', '🐟', '🥩', '🛵', '🪴', '👓', '📚', '🧾', '🏥'
];

export default function CategoryManagerModal({
  isOpen,
  onClose,
  expenseCategories,
  incomeCategories,
  onSaveExpenseCategories,
  onSaveIncomeCategories
}) {
  const [activeTab, setActiveTab] = useState('expense'); // 'expense' | 'income'
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍲');

  if (!isOpen) return null;

  const currentCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      alert('กรุณาพิมพ์ชื่อหมวดหมู่ครับ');
      return;
    }

    playSuccessSound();
    const newCat = {
      id: 'cat-' + Date.now(),
      name: newCatName.trim(),
      icon: selectedEmoji,
      quickNotes: []
    };

    if (activeTab === 'expense') {
      onSaveExpenseCategories([...expenseCategories, newCat]);
    } else {
      onSaveIncomeCategories([...incomeCategories, newCat]);
    }

    setNewCatName('');
    setIsAdding(false);
  };

  const handleDeleteCategory = (catId) => {
    if (currentCategories.length <= 1) {
      alert('ต้องมีหมวดหมู่เหลืออยู่อย่างน้อย 1 หมวดครับ');
      return;
    }
    playTapSound();
    if (activeTab === 'expense') {
      onSaveExpenseCategories(expenseCategories.filter(c => c.id !== catId));
    } else {
      onSaveIncomeCategories(incomeCategories.filter(c => c.id !== catId));
    }
  };

  const handleResetToDefault = () => {
    if (confirm('ต้องการคืนค่าหมวดหมู่ทั้งหมดกลับเป็นค่าเริ่มต้นใช่ไหมครับ?')) {
      playTapSound();
      if (activeTab === 'expense') {
        onSaveExpenseCategories(EXPENSE_CATEGORIES);
      } else {
        onSaveIncomeCategories(INCOME_CATEGORIES);
      }
    }
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
              จัดการหมวดหมู่รายรับ-รายจ่าย
            </h2>
            <p className="text-xs text-stone-300 truncate">
              เพิ่มหรือลบหมวดหมู่ให้ตรงกับชีวิตประจำวัน
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

        {/* Tab switch */}
        <div className="p-3 pb-0 bg-white">
          <div className="bg-[#EBE7DF] p-1 rounded-xl flex gap-1">
            <button
              onClick={() => {
                playTapSound();
                setActiveTab('expense');
                setIsAdding(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'expense'
                  ? 'bg-[#BA3C2A] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              หมวดรายจ่าย ({expenseCategories.length})
            </button>
            <button
              onClick={() => {
                playTapSound();
                setActiveTab('income');
                setIsAdding(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'income'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              หมวดรายรับ ({incomeCategories.length})
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3">
          
          {/* Add Category Trigger / Form */}
          {!isAdding ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  playTapSound();
                  setIsAdding(true);
                  setSelectedEmoji(activeTab === 'expense' ? '🍲' : '💰');
                }}
                className="btn-tactile flex-1 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-stone-300 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มหมวดหมู่ใหม่</span>
              </button>

              <button
                onClick={handleResetToDefault}
                className="btn-tactile px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium text-xs flex items-center gap-1 border border-stone-300 cursor-pointer"
                title="คืนค่าเริ่มต้น"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>คืนค่าเดิม</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#FAF9F5] p-3 rounded-xl border border-stone-300 space-y-2.5">
              <div className="text-xs font-bold text-stone-800">
                เพิ่มหมวด{activeTab === 'expense' ? 'รายจ่าย' : 'รายรับ'}ใหม่
              </div>

              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="ชื่อหมวดหมู่ เช่น ค่าอาหารแมว, ค่าหวย"
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs sm:text-sm bg-white"
              />

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">เลือกรูปไอคอน:</label>
                <div className="flex gap-1.5 flex-wrap max-h-24 overflow-y-auto p-1 bg-white rounded-lg border border-stone-200">
                  {AVAILABLE_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-7 h-7 rounded-md text-base flex items-center justify-center cursor-pointer ${
                        selectedEmoji === emoji ? 'bg-stone-800 text-white' : 'hover:bg-stone-100'
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
                  className="flex-1 py-1.5 rounded-lg bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="flex-1 py-1.5 rounded-lg bg-[#2D6A4F] text-white text-xs font-semibold cursor-pointer"
                >
                  บันทึกหมวดใหม่
                </button>
              </div>
            </div>
          )}

          {/* Current Categories List */}
          <div className="space-y-1.5">
            {currentCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-2.5 rounded-xl border border-stone-200 bg-[#FAF9F5] flex items-center justify-between gap-2 shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xl flex-shrink-0">{cat.icon}</span>
                  <span className="text-xs sm:text-sm font-semibold text-stone-800 truncate">
                    {cat.name}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1 rounded-md text-stone-400 hover:text-red-600 cursor-pointer flex-shrink-0"
                  title="ลบหมวดหมู่นี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
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
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}
