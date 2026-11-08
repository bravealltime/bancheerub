import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Mic, MicOff, Sparkles, Check, Volume2, Trash2, 
  Calculator, TrendingUp, TrendingDown 
} from 'lucide-react';
import { playTapSound, playSuccessSound, playDeleteSound, speakThai } from '../utils/audio';
import { parseAccountingSentence } from '../utils/aiMathLedgerParser';
import { getTodayString, getCurrentTimeString } from '../utils/thaiDate';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/defaultCategories';
import confetti from 'canvas-confetti';

export default function AiSmartLedgerModal(props) {
  if (!props.isOpen) return null;

  return (
    <AiSmartLedgerModalContent key="ai-ledger-modal" {...props} />
  );
}

function AiSmartLedgerModalContent({
  onClose,
  onBatchSave,
  currentBook,
  soundEnabled = true,
  expenseCategories = EXPENSE_CATEGORIES,
  incomeCategories = INCOME_CATEGORIES
}) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveStreamingText, setLiveStreamingText] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [items, setItems] = useState([]);
  const recognitionRef = useRef(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const handleAnalyzeText = useCallback((textToAnalyze, shouldSpeak = true) => {
    if (!textToAnalyze || !textToAnalyze.trim()) return;

    const result = parseAccountingSentence(textToAnalyze);
    if (result && result.items) {
      setParsedResult(result);
      setItems(result.items);

      if (shouldSpeak && result.speechAnswer && soundEnabled) {
        speakThai(result.speechAnswer);
      }
    }
  }, [soundEnabled]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setLiveStreamingText('กำลังรับฟังเสียงสด...');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentStream = (finalTranscript + ' ' + interimTranscript).trim();
        if (currentStream) {
          setLiveStreamingText(currentStream);
        }

        const effectiveText = (finalTranscript || interimTranscript).trim();
        if (effectiveText) {
          setInputText(effectiveText);
          handleAnalyzeText(effectiveText, false);
        }
      };

      recognition.onerror = (e) => {
        console.warn('[AI Voice] Recognition error:', e);
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition init error:', err);
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [handleAnalyzeText]);

  // Auto start speech recognition upon opening
  useEffect(() => {
    const timer = setTimeout(() => {
      startListening();
    }, 350);
    return () => {
      clearTimeout(timer);
      stopListening();
    };
  }, [startListening, stopListening]);

  const handleToggleMic = () => {
    playTapSound();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleApplySample = (sampleText) => {
    playTapSound();
    stopListening();
    setInputText(sampleText);
    setLiveStreamingText(sampleText);
    handleAnalyzeText(sampleText, true);
  };

  const handleToggleItemCheck = (id) => {
    playTapSound();
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleItemNoteChange = (id, newNote) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, note: newNote } : item
    ));
  };

  const handleItemAmountChange = (id, newAmountStr) => {
    const val = parseFloat(newAmountStr) || 0;
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, amount: val } : item
    ));
  };

  const handleItemCategoryChange = (id, catId) => {
    playTapSound();
    const item = items.find(i => i.id === id);
    if (!item) return;

    const cats = item.type === 'expense' ? expenseCategories : incomeCategories;
    const foundCat = cats.find(c => c.id === catId);
    if (foundCat) {
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, categoryId: foundCat.id, categoryName: foundCat.name, categoryIcon: foundCat.icon } : i
      ));
    }
  };

  const handleDeleteItem = (id) => {
    playDeleteSound();
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Re-calculate live totals from active selected items
  const activeItems = items.filter(i => i.selected);
  const currentTotalIncome = activeItems.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0);
  const currentTotalExpense = activeItems.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0);
  const currentNetChange = currentTotalIncome - currentTotalExpense;
  const currentRemaining = parsedResult?.startingBalance !== null && parsedResult?.startingBalance !== undefined
    ? parsedResult.startingBalance + currentNetChange
    : currentNetChange;

  const handleSaveAll = () => {
    if (activeItems.length === 0) {
      alert('ไม่มีรายการที่เลือกบันทึกครับ');
      return;
    }

    playSuccessSound();
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    const todayStr = getTodayString();
    const nowTimeStr = getCurrentTimeString();

    // Map into ledger transaction models
    const newTransactions = activeItems.map((item, idx) => ({
      id: `tx-ai-${Date.now()}-${idx}`,
      bookId: currentBook?.id || 'book-1',
      type: item.type,
      amount: item.amount,
      category: item.categoryName,
      categoryId: item.categoryId,
      note: item.note,
      date: todayStr,
      time: nowTimeStr,
      createdAt: new Date().toISOString()
    }));

    if (soundEnabled) {
      speakThai(`บันทึก ${newTransactions.length} รายการลงสมุดบัญชีเรียบร้อยแล้วครับ`);
    }

    onBatchSave(newTransactions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shadow-xs flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-yellow-200 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>AI ผู้ช่วยแยกบัญชี & คำนวณเลข</span>
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                พูดเป็นประโยคยาว มีคิดเลขคูณหาร ระบบจะแยกรายการให้อัตโนมัติ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              stopListening();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer text-white"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Voice Listening Bar & Input */}
          <div className="bg-stone-50 border-2 border-dashed border-amber-300 rounded-2xl p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <span className="text-base">🎙️</span> พูดหรือพิมพ์ประโยคการเงินของคุณ:
              </span>

              {/* Toggle Mic Button */}
              <button
                type="button"
                onClick={handleToggleMic}
                className={`btn-tactile px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isListening 
                    ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-md' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>กำลังฟัง... (แตะเพื่อหยุด)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>แตะเพื่อพูดสด 🔊</span>
                  </>
                )}
              </button>
            </div>

            {/* Input / Transcript Box */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="ตัวอย่าง: วันนี้ไปซื้อไก่มา 20 ชิ้น ชิ้นละ 10 บาท กับหมูปิ้ง 10 ไม้ ไม้ละ 10 บาท ได้เงินจากคุณพ่อ 300 บาท เงินเดิมมี 800 บาท เหลือเท่าไหร่"
                rows={3}
                className="w-full text-sm sm:text-base font-medium p-3 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed shadow-inner"
              />
              {inputText.trim() && (
                <button
                  type="button"
                  onClick={() => handleAnalyzeText(inputText, true)}
                  className="btn-tactile absolute right-2.5 bottom-3.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>คำนวณ</span>
                </button>
              )}
            </div>

            {/* Live Streaming Hint */}
            {isListening && liveStreamingText && (
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-medium animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="truncate">ได้ยินว่า: "{liveStreamingText}"</span>
              </div>
            )}

            {/* Sample Prompts */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-stone-500">แตะเพื่อทดสอบประโยคตัวอย่าง:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplySample("วันนี้ไปซื้อไก่มา 20 ชิ้น ชิ้นละ 10 บาท กับหมูปิ้งอีก 10 ไม้ ไม้ละ 10 บาท โดยได้เงินมาจากคุณพ่อทั้งหมด 300 บาท และเงินที่ตัวเองมีอยู่แล้ว 800 บาท ตอนนี้เหลือเงินเท่าไหร่")}
                  className="text-left text-[11px] font-medium bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-400 text-stone-800 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all shadow-2xs"
                >
                  🐔 ซื้อไก่ 20 ชิ้น + หมูปิ้ง 10 ไม้ + พ่อให้ 300 (เงินเดิม 800)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySample("ลูกสาวให้เงินมา 2000 บาท จ่ายค่ายา 350 บาท ซื้อส้ม 2 กิโล โลละ 60 บาท ตอนนี้เหลือเงินกี่บาท")}
                  className="text-left text-[11px] font-medium bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-400 text-stone-800 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all shadow-2xs"
                >
                  💊 ลูกสาวให้ 2,000 + ค่ายา 350 + ซื้อส้ม 2 โล
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySample("ขายกล้วยได้ 5 หวี หวีละ 30 บาท ซื้อปุ๋ย 80 บาท")}
                  className="text-left text-[11px] font-medium bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-400 text-stone-800 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all shadow-2xs"
                >
                  🍌 ขายกล้วย 5 หวี + ซื้อปุ๋ย 80 บาท
                </button>
              </div>
            </div>
          </div>

          {/* AI Accounting Calculation Card (Displays when parsed) */}
          {parsedResult && (
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl p-4 shadow-lg space-y-3 border border-stone-700 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-stone-700 pb-2.5">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 tracking-wide uppercase">
                    สรุปผลการคิดเลข & สถิติบัญชี
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    speakThai(parsedResult.speechAnswer);
                  }}
                  className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors"
                  aria-label="ฟังเสียงสรุป"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>ฟังเสียงสรุป 🔊</span>
                </button>
              </div>

              {/* 4 Metric Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {/* 1. เงินเดิม (ถ้ามี) */}
                <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                  <span className="text-[10px] text-stone-400 font-medium block">เงินเดิมที่มี</span>
                  <span className="text-xs sm:text-sm font-bold text-stone-200">
                    {parsedResult.startingBalance !== null ? `฿${parsedResult.startingBalance.toLocaleString()}` : '-'}
                  </span>
                </div>

                {/* 2. รวมรายรับ */}
                <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-300 font-medium block flex items-center justify-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> รวมรายรับ
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-400">
                    +฿{currentTotalIncome.toLocaleString()}
                  </span>
                </div>

                {/* 3. รวมรายจ่าย */}
                <div className="bg-rose-950/40 rounded-xl p-2 border border-rose-500/30">
                  <span className="text-[10px] text-rose-300 font-medium block flex items-center justify-center gap-0.5">
                    <TrendingDown className="w-2.5 h-2.5" /> รวมรายจ่าย
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-rose-400">
                    -฿{currentTotalExpense.toLocaleString()}
                  </span>
                </div>

                {/* 4. ยอดคงเหลือสุทธิ */}
                <div className="bg-amber-950/50 rounded-xl p-2 border border-amber-500/40">
                  <span className="text-[10px] text-amber-300 font-bold block">ยอดคงเหลือสุทธิ</span>
                  <span className={`text-xs sm:text-sm font-black ${currentRemaining >= 0 ? 'text-amber-300' : 'text-rose-300'}`}>
                    ฿{currentRemaining.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Spoken Answer Text */}
              <p className="text-xs text-stone-300 bg-black/30 p-2.5 rounded-xl leading-relaxed border border-white/5">
                💬 {parsedResult.speechAnswer}
              </p>
            </div>
          )}

          {/* Itemized Transactions Checklist */}
          {items.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-stone-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>แยกได้ {items.length} รายการ (เลือกเพื่อบันทึก):</span>
                </span>
                <span className="text-xs text-stone-500">
                  เลือกแล้ว {activeItems.length} รายการ
                </span>
              </div>

              <div className="space-y-2">
                {items.map((item) => {
                  const isExp = item.type === 'expense';
                  const cats = isExp ? expenseCategories : incomeCategories;

                  return (
                    <div 
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        item.selected 
                          ? isExp 
                            ? 'bg-rose-50/50 border-rose-200 shadow-2xs' 
                            : 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                          : 'bg-stone-50 border-stone-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleItemCheck(item.id)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer mt-0.5 ${
                            item.selected
                              ? isExp ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                              : 'border-2 border-stone-300 bg-white'
                          }`}
                          aria-label={item.selected ? 'ยกเลิกรายการนี้' : 'เลือกรายการนี้'}
                        >
                          {item.selected && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            {/* Category Selector */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-base">{item.categoryIcon}</span>
                              <select
                                value={item.categoryId}
                                onChange={(e) => handleItemCategoryChange(item.id, e.target.value)}
                                className="text-xs font-bold bg-white/80 border border-stone-200 rounded-lg px-2 py-0.5 text-stone-800 cursor-pointer focus:ring-1 focus:ring-amber-500"
                              >
                                {cats.map(c => (
                                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                ))}
                              </select>

                              {/* Formula tag if arithmetic */}
                              {item.formulaText && (
                                <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200 font-semibold">
                                  {item.formulaText}
                                </span>
                              )}
                            </div>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-stone-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                              title="ลบรายการนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Editable Note & Amount */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={item.note}
                              onChange={(e) => handleItemNoteChange(item.id, e.target.value)}
                              placeholder="รายละเอียด"
                              className="sm:col-span-2 text-xs sm:text-sm font-medium p-1.5 rounded-lg bg-white border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <div className="flex items-center gap-1">
                              <span className={`text-xs font-bold ${isExp ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isExp ? '-฿' : '+฿'}
                              </span>
                              <input
                                type="number"
                                value={item.amount || ''}
                                onChange={(e) => handleItemAmountChange(item.id, e.target.value)}
                                className="w-full text-xs sm:text-sm font-bold p-1.5 rounded-lg bg-white border border-stone-200 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state prompt if nothing yet */}
          {items.length === 0 && !isListening && (
            <div className="text-center py-6 text-stone-400 space-y-2">
              <Calculator className="w-10 h-10 mx-auto text-stone-300 stroke-[1.5]" />
              <p className="text-xs sm:text-sm font-medium">
                แตะปุ่ม "แตะเพื่อพูดสด" หรือแตะประโยคตัวอย่างด้านบน เพื่อเริ่มทดสอบได้เลยครับ
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer: Batch Save Button */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex-shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              stopListening();
              onClose();
            }}
            className="btn-tactile px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs sm:text-sm font-bold cursor-pointer transition-all"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={activeItems.length === 0}
            className="btn-tactile flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] hover:from-[#24563F] hover:to-[#143426] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>
              {activeItems.length > 0 
                ? `บันทึกลงสมุดทั้งหมด (${activeItems.length} รายการ)`
                : 'เลือกรายการเพื่อบันทึก'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
