import React, { useState } from 'react';
import { X, Check, Mic, MicOff, Settings2 } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/defaultCategories';
import { getTodayString, getCurrentTimeString } from '../utils/thaiDate';
import { playTapSound, playSuccessSound, speakThai } from '../utils/audio';
import { parseThaiVoiceInput } from '../utils/voiceParser';
import confetti from 'canvas-confetti';

export default function RecordModal(props) {
  if (!props.isOpen) return null;

  const modalKey = props.editingItem 
    ? `edit-${props.editingItem.id}` 
    : `new-${props.initialType}-${props.currentBook?.id || 'default'}`;

  return (
    <RecordModalForm key={modalKey} {...props} />
  );
}

function RecordModalForm({
  initialType = 'expense',
  editingItem = null,
  onClose,
  onSave,
  soundEnabled,
  expenseCategories = EXPENSE_CATEGORIES,
  incomeCategories = INCOME_CATEGORIES,
  onOpenCategoryManager,
  currentBook
}) {
  const [type, setType] = useState(() => editingItem ? editingItem.type : initialType);
  const [amountStr, setAmountStr] = useState(() => editingItem ? String(editingItem.amount) : '');
  const [note, setNote] = useState(() => editingItem?.note || '');
  const [date, setDate] = useState(() => editingItem?.date || getTodayString());
  const [isListening, setIsListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState('');

  const isExpense = type === 'expense';
  const categories = isExpense ? expenseCategories : incomeCategories;

  const [selectedCategory, setSelectedCategory] = useState(() => {
    const activeType = editingItem ? editingItem.type : initialType;
    const cats = activeType === 'expense' ? expenseCategories : incomeCategories;
    if (editingItem) {
      const found = cats.find(c => c.id === editingItem.categoryId || c.name === editingItem.category);
      if (found) return found;
    }
    return cats[0] || { id: 'other', name: 'ทั่วไป', icon: '💰' };
  });

  const handleToggleType = (newType) => {
    playTapSound();
    setType(newType);
    const cats = newType === 'expense' ? expenseCategories : incomeCategories;
    setSelectedCategory(cats[0] || { id: 'other', name: 'ทั่วไป', icon: '💰' });
  };

  const handleQuickAdd = (val) => {
    playTapSound();
    const current = parseFloat(amountStr) || 0;
    setAmountStr(String(current + val));
  };

  const handleClearAmount = () => {
    playTapSound();
    setAmountStr('');
  };

  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('อุปกรณ์นี้ยังไม่รองรับการสั่งด้วยเสียง สามารถพิมพ์หรือกดปุ่มตัวเลขแทนได้ครับ');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceHint('กำลังฟังเสียง... พูดได้เลยครับ');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceHint(`ได้ยินว่า: "${transcript}"`);

        const parsed = parseThaiVoiceInput(transcript);
        if (parsed) {
          if (parsed.type) {
            setType(parsed.type);
            const cats = parsed.type === 'expense' ? expenseCategories : incomeCategories;
            const cat = cats.find(c => c.id === parsed.categoryId) || cats[0];
            setSelectedCategory(cat);
          }
          if (parsed.amount > 0) {
            setAmountStr(String(parsed.amount));
          }
          if (parsed.note) {
            setNote(parsed.note);
          }
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceHint('ไม่ได้ยินเสียง ลองกดใหม่อีกครั้งครับ');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      console.error('Speech recognition error', err);
    }
  };

  const handleSave = () => {
    const numAmount = parseFloat(amountStr);
    if (!numAmount || numAmount <= 0) {
      alert('กรุณาใส่จำนวนเงินก่อนบันทึกนะครับ');
      return;
    }

    playSuccessSound();

    try {
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.7 }
      });
    } catch {
      // Ignore
    }

    const itemData = {
      id: editingItem ? editingItem.id : 'tx-' + Date.now(),
      type: type,
      amount: numAmount,
      bookId: currentBook?.id || 'book-grandpa',
      category: selectedCategory ? selectedCategory.name : (isExpense ? 'ของกิน' : 'เงินเข้า'),
      categoryIcon: selectedCategory ? selectedCategory.icon : '💰',
      categoryId: selectedCategory ? selectedCategory.id : 'other',
      note: note.trim() || (selectedCategory ? selectedCategory.name : ''),
      date: date,
      time: editingItem ? editingItem.time : getCurrentTimeString(),
      timestamp: editingItem ? editingItem.timestamp : Date.now()
    };

    onSave(itemData);

    if (soundEnabled) {
      const typeWord = isExpense ? 'รายจ่าย' : 'รายรับ';
      const catWord = selectedCategory ? selectedCategory.name.split('/')[0].trim() : '';
      const speech = `บันทึก${typeWord} ${catWord} ${Math.round(numAmount)} บาท เรียบร้อยแล้วครับ`;
      speakThai(speech);
    }

    onClose();
  };

  const numAmount = parseFloat(amountStr) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto no-print animate-fade">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* 1. Header with Type Switcher & Close */}
        <div className="p-3 sm:p-3.5 bg-[#FAF9F5] border-b border-stone-200 flex items-center justify-between gap-2 flex-shrink-0">
          {/* Top Switcher Tabs */}
          <div className="flex bg-[#EFECE6] p-1 rounded-2xl gap-1 flex-1 max-w-[260px]">
            <button
              type="button"
              onClick={() => handleToggleType('expense')}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                isExpense
                  ? 'bg-[#BA3C2A] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              รายจ่าย
            </button>
            <button
              type="button"
              onClick={() => handleToggleType('income')}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                !isExpense
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              รายรับ
            </button>
          </div>

          {/* Book owner label */}
          <div className="text-right min-w-0 flex-1 hidden sm:block">
            <span className="text-xs font-semibold text-stone-500 truncate block">
              {currentBook?.name || 'สมุด'}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600 cursor-pointer flex-shrink-0"
            aria-label="ปิด"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Scrollable Body (Clean & Minimal) */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          
          {/* A. Amount Input Box + Quick Chips */}
          <div className="bg-[#FAF9F5] rounded-2xl p-3 border-2 border-stone-200 focus-within:border-stone-500 transition-colors text-center space-y-2">
            <div className="text-[11px] font-bold text-stone-500">
              {isExpense ? 'จำนวนเงินที่จ่าย (บาท):' : 'จำนวนเงินที่รับ (บาท):'}
            </div>

            {/* Input with Currency Prefix & Mic Button */}
            <div className="flex items-center justify-center gap-2">
              <span className={`text-2xl sm:text-3xl font-bold font-['Prompt'] ${
                isExpense ? 'text-[#BA3C2A]' : 'text-[#2D6A4F]'
              }`}>
                ฿
              </span>
              
              <input
                type="number"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (!isNaN(val) && parseFloat(val) >= 0 && val.length <= 8)) {
                    setAmountStr(val);
                  }
                }}
                placeholder="0"
                autoFocus
                className={`w-40 sm:w-48 text-center text-3xl sm:text-4xl font-bold font-['Prompt'] bg-transparent focus:outline-none placeholder-stone-300 ${
                  isExpense ? 'text-[#BA3C2A]' : 'text-[#2D6A4F]'
                }`}
              />

              {/* Voice Input Mic Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-md'
                    : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-100 shadow-xs'
                }`}
                title="แตะเพื่อพูดบอกจำนวนเงิน"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {/* Voice hint if active */}
            {voiceHint && (
              <p className="text-xs font-semibold text-stone-700 bg-white py-1 px-2.5 rounded-lg border border-stone-200 inline-block animate-fade">
                {voiceHint}
              </p>
            )}

            {/* Quick add buttons (1 row) */}
            <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-stone-200 flex-wrap">
              {[20, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="btn-tactile px-2.5 py-1 rounded-xl bg-white border border-stone-300 hover:border-stone-400 text-stone-800 font-bold text-xs cursor-pointer shadow-xs font-['Prompt']"
                >
                  +{val}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearAmount}
                className="btn-tactile px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-600 font-bold text-xs cursor-pointer"
              >
                ล้าง
              </button>
            </div>
          </div>

          {/* B. Category Selection (Clean 2-Column Grid) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <label className="text-xs font-bold text-stone-700">
                เป็นค่าอะไร:
              </label>
              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onOpenCategoryManager();
                  }}
                  className="text-[11px] text-stone-500 hover:text-stone-800 underline flex items-center gap-1 cursor-pointer"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>จัดการหมวด</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setSelectedCategory(cat);
                    }}
                    className={`btn-tactile py-2 px-2.5 rounded-xl border-2 flex items-center gap-2 text-left transition-all cursor-pointer min-w-0 ${
                      isSelected
                        ? (isExpense
                            ? 'bg-[#BA3C2A] border-[#BA3C2A] text-white shadow-xs font-bold'
                            : 'bg-[#2D6A4F] border-[#2D6A4F] text-white shadow-xs font-bold')
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">
                      {cat.icon}
                    </span>
                    <span className="text-xs font-semibold truncate flex-1 min-w-0">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* C. Note & Date (Single Compact Row) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-stone-600 px-0.5">
              บันทึกย่อ และ วันที่:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น ก๋วยเตี๋ยว, ค่ายา (ไม่ใส่ก็ได้)"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-500 text-xs sm:text-sm bg-white"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-32 flex-shrink-0 px-2 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-500 text-xs font-semibold bg-white text-stone-700"
              />
            </div>
          </div>

        </div>

        {/* 3. Bottom Big Save Button */}
        <div className="p-3 sm:p-3.5 bg-[#FAF9F5] border-t border-stone-200 flex-shrink-0">
          <button
            type="button"
            onClick={handleSave}
            className={`btn-tactile w-full py-3 px-4 rounded-2xl font-bold text-sm sm:text-base text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all ${
              isExpense
                ? 'bg-[#BA3C2A] hover:bg-[#9E3323]'
                : 'bg-[#2D6A4F] hover:bg-[#23533E]'
            }`}
          >
            <Check className="w-5 h-5 stroke-[3] flex-shrink-0" />
            <span className="truncate">
              {editingItem
                ? 'บันทึกการแก้ไข'
                : `บันทึก${isExpense ? 'รายจ่าย' : 'รายรับ'} ${numAmount > 0 ? `${Math.round(numAmount)} บาท` : ''}`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
