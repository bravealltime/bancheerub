import React, { useState } from 'react';
import { X, Plus, Trash2, Check, RotateCcw } from 'lucide-react';
import { DEFAULT_ACCOUNTS } from '../data/defaultAccounts';
import { formatCurrency } from '../utils/thaiDate';
import { playTapSound, playSuccessSound } from '../utils/audio';

const ACCOUNT_EMOJIS = ['🏠', '🏢', '👨‍👩‍👦', '👛', '👵', '👴', '🌾', '🐱', '🛵', '📦', '🏪', '💰', '🪴', '🚗', '🛍️', '💼'];

export default function AccountManagerModal({
  isOpen,
  onClose,
  accounts,
  onSaveAccounts,
  activeAccountId,
  onSelectAccount,
  transactions
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏠');

  if (!isOpen) return null;

  // Calculate balance for each account
  const accountBalances = accounts.reduce((acc, account) => {
    const accTxs = transactions.filter(t => (t.accountId || 'acc-home') === account.id);
    const inc = accTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = accTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    acc[account.id] = inc - exp;
    return acc;
  }, {});

  const handleAddAccount = () => {
    if (!name.trim()) {
      alert('กรุณากรอกชื่อบัญชีครับ');
      return;
    }

    playSuccessSound();
    const newAcc = {
      id: 'acc-' + Date.now(),
      name: name.trim(),
      icon: selectedEmoji,
      description: description.trim()
    };

    onSaveAccounts([...accounts, newAcc]);
    onSelectAccount(newAcc.id);
    setName('');
    setDescription('');
    setIsAdding(false);
  };

  const handleDeleteAccount = (accId) => {
    if (accounts.length <= 1) {
      alert('ต้องมีบัญชีอย่างน้อย 1 บัญชีครับ');
      return;
    }

    if (confirm('ต้องการลบบัญชีนี้ใช่ไหมครับ? (รายการเงินที่เคยจดไว้จะยังอยู่ แต่จะถูกย้ายไปแสดงในบัญชีรวม)')) {
      playTapSound();
      const updated = accounts.filter(a => a.id !== accId);
      onSaveAccounts(updated);
      if (activeAccountId === accId) {
        onSelectAccount(updated[0].id);
      }
    }
  };

  const handleResetDefault = () => {
    if (confirm('ต้องการคืนค่าบัญชีมาตรฐาน (เงินบ้าน, ครอบครัว, ร้านค้า, ส่วนตัว) ใช่ไหมครับ?')) {
      playTapSound();
      onSaveAccounts(DEFAULT_ACCOUNTS);
      onSelectAccount('all');
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
              จัดการกระเป๋าเงิน / บัญชีแยกส่วน
            </h2>
            <p className="text-xs text-stone-300 truncate">
              แยกเงินบ้าน เงินครอบครัว เงินบริษัท หรือกระเป๋าส่วนตัว
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

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3">
          
          {/* Add Account Button / Form */}
          {!isAdding ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  playTapSound();
                  setIsAdding(true);
                }}
                className="btn-tactile flex-1 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-stone-300 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มบัญชีใหม่</span>
              </button>

              <button
                onClick={handleResetDefault}
                className="btn-tactile px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium text-xs flex items-center gap-1 border border-stone-300 cursor-pointer"
                title="คืนค่าเริ่มต้น"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>คืนค่าเดิม</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#FAF9F5] p-3 rounded-xl border border-stone-300 space-y-2.5">
              <div className="text-xs font-bold text-stone-800">สร้างกระเป๋าเงิน / บัญชีใหม่</div>

              {/* Name */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อบัญชี เช่น เงินร้านอาหาร, เงินสวน, กองกลาง"
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs sm:text-sm bg-white"
              />

              {/* Description */}
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="คำอธิบายสั้นๆ (ถ้ามี)"
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs sm:text-sm bg-white"
              />

              {/* Emoji Picker */}
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">เลือกรูปไอคอน:</label>
                <div className="flex gap-1.5 flex-wrap p-1 bg-white rounded-lg border border-stone-200">
                  {ACCOUNT_EMOJIS.map(emoji => (
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

              {/* Buttons */}
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
                  onClick={handleAddAccount}
                  className="flex-1 py-1.5 rounded-lg bg-[#2D6A4F] text-white text-xs font-semibold cursor-pointer"
                >
                  บันทึกบัญชีใหม่
                </button>
              </div>
            </div>
          )}

          {/* Current Accounts List */}
          <div className="space-y-2">
            {accounts.map((acc) => {
              const isCurrent = activeAccountId === acc.id;
              const bal = accountBalances[acc.id] || 0;

              return (
                <div
                  key={acc.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                    isCurrent
                      ? 'bg-stone-100 border-stone-800 shadow-xs'
                      : 'bg-[#FAF9F5] border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* Left: Info */}
                  <div
                    onClick={() => {
                      playTapSound();
                      onSelectAccount(acc.id);
                    }}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="text-2xl flex-shrink-0">{acc.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          {acc.name}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-stone-800 text-white font-semibold">
                            กำลังเลือกดู
                          </span>
                        )}
                      </div>
                      {acc.description && (
                        <p className="text-[11px] text-stone-500 truncate">
                          {acc.description}
                        </p>
                      )}
                      <p className="text-xs font-bold text-stone-700 font-['Prompt'] mt-0.5">
                        ยอดคงเหลือ: ฿{formatCurrency(bal)} บาท
                      </p>
                    </div>
                  </div>

                  {/* Right: Select & Delete */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        playTapSound();
                        onSelectAccount(acc.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        isCurrent
                          ? 'bg-stone-800 text-white'
                          : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {isCurrent ? <Check className="w-3.5 h-3.5 inline mr-1 stroke-[3]" /> : null}
                      <span>{isCurrent ? 'ใช้งานอยู่' : 'เลือกดู'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-1 rounded-md text-stone-400 hover:text-red-600 cursor-pointer"
                      title="ลบบัญชีนี้"
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
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}
