import React, { useState } from 'react';
import { X, Home, Copy, Check, Share2, Plus, ArrowRight, Trash2, Edit3 } from 'lucide-react';
import {
  generateHouseCode,
  normalizeHouseCode,
  getHouseInviteUrl,
  getSavedHouses,
  saveHouseToList,
  removeHouseFromList,
  setHouseName,
  DEFAULT_MAIN_HOUSE_ID
} from '../utils/houseManager';
import { copyToClipboard, getLineShareUrl } from '../utils/shareLine';
import { playTapSound, playSuccessSound } from '../utils/audio';

export default function HouseManagerModal({
  isOpen,
  onClose,
  currentHouseId,
  currentHouseName,
  onSwitchHouse,
  onUpdateHouseName
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState(currentHouseName || '');
  const [savedHouses, setSavedHouses] = useState(() => getSavedHouses());

  if (!isOpen) return null;

  const inviteUrl = getHouseInviteUrl(currentHouseId);
  const lineShareUrl = getLineShareUrl(`🏠 ชวนเข้าสมุดเงินทองของบ้านเรา\nรหัสบ้าน: ${currentHouseId}\nกดแตะลิงก์นี้เพื่อเข้าดูบัญชีบ้านได้ทันทีครับ:\n${inviteUrl}`);

  const handleCopyCode = async () => {
    playTapSound();
    const ok = await copyToClipboard(currentHouseId);
    if (ok) {
      playSuccessSound();
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleCopyLink = async () => {
    playTapSound();
    const ok = await copyToClipboard(inviteUrl);
    if (ok) {
      playSuccessSound();
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCreateNewHouse = () => {
    playTapSound();
    const newCode = generateHouseCode();
    const defaultName = `บ้าน ${newCode}`;
    saveHouseToList(newCode, defaultName);
    onSwitchHouse(newCode, defaultName);
    setSavedHouses(getSavedHouses());
    playSuccessSound();
  };

  const handleJoinHouse = (e) => {
    e.preventDefault();
    const clean = normalizeHouseCode(joinCodeInput);
    if (!clean) {
      alert('กรุณาใส่รหัสบ้านก่อนนะครับ เช่น HOME-1234');
      return;
    }
    playTapSound();
    const defaultName = `บ้าน ${clean}`;
    saveHouseToList(clean, defaultName);
    onSwitchHouse(clean, defaultName);
    setJoinCodeInput('');
    setSavedHouses(getSavedHouses());
    playSuccessSound();
  };

  const handleSaveName = () => {
    if (!editNameInput.trim()) return;
    playTapSound();
    setHouseName(currentHouseId, editNameInput.trim());
    onUpdateHouseName(editNameInput.trim());
    setIsEditingName(false);
    setSavedHouses(getSavedHouses());
  };

  const handleDeleteSavedHouse = (houseId) => {
    if (houseId === currentHouseId) {
      alert('ไม่สามารถลบบ้านที่กำลังเปิดใช้งานอยู่ได้ครับ');
      return;
    }
    playTapSound();
    removeHouseFromList(houseId);
    setSavedHouses(getSavedHouses());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 no-print animate-fade overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#1C2D27] text-white p-3.5 sm:p-4 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-xl shrink-0">
              🏡
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate">
                ระบบบ้าน & ส่งต่อให้คนอื่นใช้งาน
              </h2>
              <p className="text-xs text-emerald-200/80 truncate">
                แยกบัญชีอิสระสำหรับแต่ละครอบครัว
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer shrink-0"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* 1. Active House Card */}
          <div className="bg-gradient-to-br from-[#FAF8F5] to-[#F3EEE6] p-4 rounded-2xl border-2 border-[#E5DDD2] space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ตอนนี้กำลังเปิดบ้านนี้อยู่ 🟢
                  </span>
                </div>

                {isEditingName ? (
                  <div className="space-y-2 mt-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editNameInput}
                        onChange={(e) => setEditNameInput(e.target.value)}
                        className="px-3 py-1.5 text-sm font-bold rounded-xl border-2 border-emerald-500 bg-white min-w-0 flex-1 shadow-2xs"
                        placeholder="ตั้งชื่อบ้านของคุณ เช่น บ้านสุขใจ"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveName}
                        className="btn-tactile px-3 py-1.5 text-xs font-bold rounded-xl bg-[#2D6A4F] text-white cursor-pointer shadow-xs"
                      >
                        บันทึก
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(false)}
                        className="btn-tactile px-2.5 py-1.5 text-xs font-bold rounded-xl bg-stone-200 text-stone-700 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                    {/* Quick name presets */}
                    <div className="flex flex-wrap gap-1">
                      {['🏡 บ้านสุขใจ', '👴👵 บ้านคุณตาคุณยาย', '👨‍👩‍👧 บ้านเรา', '🌳 บ้านสวน'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setEditNameInput(preset)}
                          className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-medium cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-stone-900 truncate">
                      {currentHouseName}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditNameInput(currentHouseName);
                        setIsEditingName(true);
                      }}
                      className="btn-tactile inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-2 py-0.5 rounded-lg border border-amber-300 cursor-pointer transition-colors"
                      title="แก้ไขชื่อบ้าน"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>เปลี่ยนชื่อ</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-stone-500">รหัสบ้าน:</span>
                  <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded-md border border-stone-300 text-stone-900 select-all">
                    {currentHouseId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="text-xs font-bold text-stone-600 hover:text-stone-900 underline flex items-center gap-0.5 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 1-Tap Invite Link Sharing */}
            <div className="pt-2 border-t border-stone-300/80 space-y-2">
              <span className="text-xs font-bold text-stone-700 block">
                📲 ส่งลิงก์นี้ให้คนในบ้าน (แตะแล้วเข้าได้ทันที ไม่ต้องพิมพ์รหัส):
              </span>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={lineShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tactile py-2 px-2.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-w-0"
                >
                  <Share2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">ส่งลิงก์เข้า LINE</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn-tactile py-2 px-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-stone-300 cursor-pointer shadow-2xs min-w-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="truncate">{copiedLink ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์เชิญ'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Create New Home or Join Existing */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-700">
              สร้างบ้านใหม่ หรือ เข้าร่วมบ้านอื่น
            </h4>

            {/* A. Create Brand New House */}
            <button
              type="button"
              onClick={handleCreateNewHouse}
              className="btn-tactile w-full p-3 rounded-2xl bg-white hover:bg-emerald-50/50 border-2 border-dashed border-emerald-500/40 text-stone-900 flex items-center justify-between text-left cursor-pointer transition-colors shadow-2xs group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs sm:text-sm block leading-tight text-[#059669]">
                    สร้างบ้านใหม่ (สำหรับครอบครัวอื่น)
                  </span>
                  <span className="text-[11px] text-stone-500 font-normal block leading-tight mt-0.5">
                    ระบบจะสร้างรหัสบ้านและสมุดเปล่าใหม่ แยกอิสระ 100%
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#059669] shrink-0" />
            </button>

            {/* B. Join by Code Form */}
            <form onSubmit={handleJoinHouse} className="flex items-center gap-1.5">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="ใส่รหัสบ้าน เช่น HOME-4821"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white font-mono placeholder-stone-400 focus:outline-none focus:border-stone-500 uppercase"
              />
              <button
                type="submit"
                className="btn-tactile px-3.5 py-2.5 rounded-xl bg-[#1C2D27] hover:bg-[#14221D] text-white font-bold text-xs sm:text-sm shrink-0 cursor-pointer shadow-xs"
              >
                เข้าร่วม
              </button>
            </form>
          </div>

          {/* 3. Previously Accessed Houses on this Device */}
          {savedHouses.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <span className="text-xs font-bold text-stone-700 block">
                บ้านที่บันทึกไว้ในเครื่องนี้ (แตะเพื่อสลับบ้านได้ทันที):
              </span>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {savedHouses.map((h) => {
                  const isCurrent = h.id === currentHouseId;
                  return (
                    <div
                      key={h.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs'
                          : 'bg-white border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!isCurrent) {
                            playTapSound();
                            onSwitchHouse(h.id, h.name);
                            playSuccessSound();
                          }
                        }}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <Home className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-emerald-700' : 'text-stone-400'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate">
                            {h.name} {isCurrent && '✓ (ปัจจุบัน)'}
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono">
                            {h.id}
                          </p>
                        </div>
                      </button>

                      {h.id !== DEFAULT_MAIN_HOUSE_ID && !isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedHouse(h.id)}
                          className="w-7 h-7 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors"
                          title="ลบออกจากรายการเครื่องนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex-shrink-0 text-center">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="btn-tactile w-full py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs sm:text-sm cursor-pointer"
          >
            เรียบร้อย
          </button>
        </div>
      </div>
    </div>
  );
}
