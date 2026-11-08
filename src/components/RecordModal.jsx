import React, { useState, useRef } from 'react';
import { X, Check, Mic, MicOff, Settings2, Camera, Trash2, Eye, Sparkles } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/defaultCategories';
import { getTodayString, getCurrentTimeString } from '../utils/thaiDate';
import { playTapSound, playSuccessSound, speakThai } from '../utils/audio';
import { parseThaiVoiceInput } from '../utils/voiceParser';
import { compressImage } from '../utils/imageCompressor';
import { scanSlipOrReceipt } from '../utils/slipOcrScanner';
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
  currentBook,
  autoStartVoice = false,
  onOpenAiLedger
}) {
  const [type, setType] = useState(() => editingItem ? editingItem.type : initialType);
  const [amountStr, setAmountStr] = useState(() => editingItem ? String(editingItem.amount) : '');
  const [note, setNote] = useState(() => editingItem?.note || '');
  const [date, setDate] = useState(() => editingItem?.date || getTodayString());
  const [image, setImage] = useState(() => editingItem?.image || null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isScanningSlip, setIsScanningSlip] = useState(false);
  const [slipScanHint, setSlipScanHint] = useState('');
  const [previewImageModal, setPreviewImageModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveStreamingText, setLiveStreamingText] = useState('');
  const [voiceHint, setVoiceHint] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [silenceSecondsLeft, setSilenceSecondsLeft] = useState(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');

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

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playTapSound();
    setIsCompressing(true);
    setIsScanningSlip(true);
    setSlipScanHint('🔍 กำลังสแกนอ่านข้อมูลจากสลิป...');

    try {
      const compressedBase64 = await compressImage(file, 900, 0.7);
      setImage(compressedBase64);

      // Perform OCR scan on slip
      const scanResult = await scanSlipOrReceipt(compressedBase64);
      if (scanResult && scanResult.success && scanResult.amount > 0) {
        setAmountStr(String(scanResult.amount));
        if (scanResult.type) {
          setType(scanResult.type);
          const cats = scanResult.type === 'expense' ? expenseCategories : incomeCategories;
          setSelectedCategory(cats[0] || { id: 'other', name: 'ทั่วไป', icon: '💰' });
        }
        if (scanResult.date) {
          setDate(scanResult.date);
        }
        if (scanResult.bankName) {
          setNote(prev => prev ? `${prev} (${scanResult.bankName})` : scanResult.bankName);
        }
        setSlipScanHint(`✅ สแกนสำเร็จ! ยอดเงิน: ฿${scanResult.amount} (${scanResult.bankName})`);
      } else {
        setSlipScanHint('แนบรูปสลิปเรียบร้อยแล้วครับ');
      }
    } catch (err) {
      console.error('Error handling image/slip:', err);
      setSlipScanHint('แนบรูปเรียบร้อยแล้วครับ');
    } finally {
      setIsCompressing(false);
      setIsScanningSlip(false);
      if (e.target) e.target.value = '';
    }
  };

  const stopVoiceRecognition = () => {
    shouldKeepListeningRef.current = false;
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSilenceSecondsLeft(null);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const resetSilenceTimer = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    let sec = 4;
    setSilenceSecondsLeft(sec);

    countdownIntervalRef.current = setInterval(() => {
      sec -= 1;
      if (sec > 0) {
        setSilenceSecondsLeft(sec);
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setSilenceSecondsLeft(null);
      }
    }, 1000);

    silenceTimeoutRef.current = setTimeout(() => {
      stopVoiceRecognition();
    }, 4000);
  };

  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('อุปกรณ์นี้ยังไม่รองรับการสั่งด้วยเสียง สามารถพิมพ์หรือกดปุ่มตัวเลขแทนได้ครับ');
      return;
    }

    if (isListening) {
      stopVoiceRecognition();
      return;
    }

    try {
      stopVoiceRecognition();
      shouldKeepListeningRef.current = true;
      accumulatedTranscriptRef.current = '';

      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setLiveStreamingText('');
        setVoiceHint('กำลังฟังเสียงต่อเนื่อง... พูดให้จบประโยคได้เลยครับ');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + ' ' + trans).trim();
          } else {
            interimTranscript += trans;
          }
        }

        const fullCurrentText = (accumulatedTranscriptRef.current + ' ' + interimTranscript).trim();
        if (fullCurrentText) {
          setLiveStreamingText(fullCurrentText);
          setVoiceTranscript(fullCurrentText);
          setVoiceHint('ถอดเสียงพูดได้แล้วครับ');

          const parsed = parseThaiVoiceInput(fullCurrentText);
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

          resetSilenceTimer();
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e);
        if (e.error === 'no-speech') return;
        stopVoiceRecognition();
        setVoiceHint('ไม่ได้ยินเสียง ลองแตะปุ่มไมโครโฟนแล้วพูดใหม่อีกครั้งครับ');
      };

      recognition.onend = () => {
        if (shouldKeepListeningRef.current) {
          try {
            recognition.start();
          } catch {
            stopVoiceRecognition();
          }
        } else {
          stopVoiceRecognition();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      stopVoiceRecognition();
      console.error('Speech recognition error', err);
    }
  };

  React.useEffect(() => {
    return () => {
      stopVoiceRecognition();
    };
  }, []);

  React.useEffect(() => {
    if (autoStartVoice && !editingItem) {
      const timer = setTimeout(() => {
        handleToggleVoice();
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      timestamp: editingItem ? editingItem.timestamp : Date.now(),
      image: image || null
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

          {/* AI Math Calculator & Narrative Parser Shortcut */}
          {onOpenAiLedger && !editingItem && (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onClose();
                onOpenAiLedger();
              }}
              className="btn-tactile px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs shrink-0"
              title="เปิด AI วิเคราะห์ประโยคยาว & คิดเลขหลายรายการ"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span className="hidden xs:inline">AI คิดเลข</span>
            </button>
          )}

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
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {/* Active Listening Pulse Banner with Real-time Live Streaming */}
          {isListening && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-3 text-center space-y-2 animate-fade shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-rose-800">
                    กำลังฟังเสียงสด... (Live Streaming)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                >
                  หยุดฟัง
                </button>
              </div>

              {/* Live Streaming Speech Text Box */}
              <div className="bg-white rounded-xl p-2.5 border border-rose-200 min-h-[46px] max-h-24 overflow-y-auto flex items-center justify-center">
                <p className="text-xs sm:text-sm font-bold text-stone-900 break-words leading-relaxed text-center">
                  {liveStreamingText || 'พูดได้เลยครับ เช่น "ซื้อกับข้าว 80" หรือ "ลูกให้ 1,000"'}
                </p>
              </div>
            </div>
          )}

          {/* Voice Transcript Card (เมื่อถอดเสียงได้แล้ว และไม่ได้กำลังฟังอยู่) */}
          {voiceTranscript && !isListening && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-2.5 sm:p-3 space-y-1.5 text-left animate-fade shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1 truncate">
                  <span>🗣️</span> ถอดเสียงได้ว่า:
                </span>
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className="text-xs text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer shrink-0"
                >
                  พูดใหม่ 🎙️
                </button>
              </div>

              {/* Transcript Text Box - Bounded and easy to read */}
              <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-amber-200/90 max-h-20 overflow-y-auto">
                <p className="text-xs sm:text-sm font-bold text-stone-900 leading-snug break-words">
                  "{voiceTranscript}"
                </p>
              </div>

              {/* Extracted Details Pill Badges */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-xs font-bold pt-0.5">
                <span className={`px-2 py-0.5 rounded-lg border ${
                  type === 'expense'
                    ? 'bg-rose-50 text-[#E11D48] border-rose-200'
                    : 'bg-emerald-50 text-[#059669] border-emerald-200'
                }`}>
                  {type === 'expense' ? '🔴 รายจ่าย' : '🟢 รายรับ'}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
                  {selectedCategory.icon} {selectedCategory.name}
                </span>
                {amountStr && (
                  <span className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-900 border border-stone-200 font-['Prompt']">
                    ฿{amountStr}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* A. Amount Input Box + Quick Chips */}
          <div className="bg-[#FAF9F5] rounded-2xl p-3 border-2 border-stone-200 focus-within:border-stone-500 transition-colors text-center space-y-2">
            <div className="text-xs sm:text-sm font-bold text-stone-600">
              {isExpense ? 'จำนวนเงินที่จ่าย (บาท):' : 'จำนวนเงินที่รับ (บาท):'}
            </div>

            {/* Input with Currency Prefix & Mic Button */}
            <div className="flex items-center justify-center gap-2">
              <span className={`text-2xl sm:text-3xl font-bold font-['Prompt'] ${
                isExpense ? 'text-[#E11D48]' : 'text-[#059669]'
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
                  isExpense ? 'text-[#E11D48]' : 'text-[#059669]'
                }`}
              />

              {/* Voice Input Mic Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-md ring-2 ring-red-300'
                    : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 shadow-xs'
                }`}
                title="แตะเพื่อพูดบันทึกเสียง"
                aria-label="พูดบันทึกเสียง"
              >
                {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-stone-700" />}
              </button>
            </div>

            {/* Listening state with 4-second silence countdown */}
            {isListening && (
              <p className="text-xs font-semibold text-amber-900 bg-amber-50 py-1 px-2.5 rounded-lg border border-amber-300 inline-block animate-fade">
                {silenceSecondsLeft !== null
                  ? `⏱️ หยุดพูดแล้ว (จะตัดไมค์อัตโนมัติใน ${silenceSecondsLeft} วิ...)`
                  : '🎙️ กำลังฟังต่อเนื่อง... พูดให้จบประโยคได้เลยครับ'}
              </p>
            )}

            {/* Voice hint if active and no transcript yet */}
            {voiceHint && !voiceTranscript && !isListening && (
              <p className="text-xs font-semibold text-stone-700 bg-white py-1 px-2.5 rounded-lg border border-stone-200 inline-block animate-fade">
                {voiceHint}
              </p>
            )}

            {/* Compound / Arithmetic detected alert */}
            {voiceTranscript && /(?:ชิ้นละ|ไม้ละ|ขวดละ|ละ|กับ|และ|โดยได้|ได้เงิน|เหลือเท่าไหร่)/.test(voiceTranscript) && onOpenAiLedger && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5 flex items-center justify-between gap-2 animate-in fade-in">
                <span className="text-xs text-amber-950 font-medium truncate">
                  ✨ มีคิดเลข/หลายรายการ
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onClose();
                    onOpenAiLedger();
                  }}
                  className="btn-tactile px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                >
                  เปิด AI แยกรายการ
                </button>
              </div>
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
                  className="text-xs text-stone-500 hover:text-stone-800 underline flex items-center gap-1 cursor-pointer"
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
            <label className="block text-xs sm:text-sm font-semibold text-stone-600 px-0.5">
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
                className="w-32 flex-shrink-0 px-2 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-500 text-xs sm:text-sm font-semibold bg-white text-stone-700"
              />
            </div>
          </div>

          {/* D. Photo Slip / Receipt Attachment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <label className="text-xs sm:text-sm font-semibold text-stone-600">
                รูปสลิป / ใบเสร็จ (อ่านยอดเงินอัตโนมัติ):
              </label>
              {isScanningSlip && (
                <span className="text-[11px] font-bold text-amber-700 animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>กำลังสแกน...</span>
                </span>
              )}
            </div>

            {!image ? (
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing || isScanningSlip}
                  className="btn-tactile w-full py-2.5 px-3 rounded-2xl bg-white border-2 border-dashed border-stone-300 hover:border-amber-500 text-stone-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:bg-amber-50/40 transition-colors"
                >
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>
                    {isScanningSlip
                      ? '🔍 กำลังสแกนอ่านยอดเงิน...'
                      : isCompressing
                      ? 'กำลังประมวลผลรูปภาพ...'
                      : '📸 ถ่ายรูป หรือ แนบสลิป/ใบเสร็จ (อ่านเลขอัตโนมัติ)'}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-[#FAF9F5] border border-stone-200">
                  <div 
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    onClick={() => setPreviewImageModal(true)}
                    title="แตะเพื่อดูรูปขนาดเต็ม"
                  >
                    <img
                      src={image}
                      alt="สลิปหรือใบเสร็จ"
                      className="w-11 h-11 object-cover rounded-xl border border-stone-300 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-stone-800 truncate">
                        แนบรูปสลิปแล้ว
                      </p>
                      <p className="text-xs text-[#2D6A4F] flex items-center gap-1 font-semibold">
                        <Eye className="w-3 h-3" />
                        <span>แตะเพื่อดูรูปใหญ่</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs cursor-pointer"
                      title="เปลี่ยนรูปสลิปใหม่"
                    >
                      เปลี่ยนรูป
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setImage(null);
                        setSlipScanHint('');
                      }}
                      className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="ลบรูปภาพ"
                      aria-label="ลบรูปภาพ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {slipScanHint && (
                  <p className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200 flex items-center gap-1">
                    <span>💡</span> {slipScanHint}
                  </p>
                )}
              </div>
            )}
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

      {/* Full-Screen Image Preview Modal */}
      {previewImageModal && image && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 flex flex-col items-center justify-center p-3 sm:p-4 animate-fade"
          onClick={() => setPreviewImageModal(false)}
        >
          <div className="relative max-w-lg w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImageModal(false)}
              className="absolute -top-11 right-0 text-white p-1.5 rounded-full bg-white/20 hover:bg-white/30 cursor-pointer"
              aria-label="ปิดรูปภาพ"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={image}
              alt="รูปสลิปหรือใบเสร็จขนาดเต็ม"
              className="max-w-full max-h-[82vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
