import React, { useState } from 'react';
import { X, Check, Copy, MessageCircle, Share2 } from 'lucide-react';
import { copyToClipboard, getLineShareUrl } from '../utils/shareLine';
import { playTapSound, playSuccessSound } from '../utils/audio';

export default function ShareSummaryModal({
  isOpen,
  onClose,
  shareData
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !shareData) return null;

  const { text = '', title = 'สรุปยอดเงิน' } = shareData;
  const lineUrl = getLineShareUrl(text);

  const handleCopy = async () => {
    playTapSound();
    const success = await copyToClipboard(text);
    if (success) {
      playSuccessSound();
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      alert('ไม่สามารถคัดลอกได้อัตโนมัติ กรุณาลองเลือกข้อความในกล่องด้านล่างแล้วกดคัดลอกครับ');
    }
  };

  const handleNativeShare = async () => {
    playTapSound();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'สรุปสมุดเงินทอง',
          text: text
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share error', err);
        }
      }
    }
  };

  const handleLineClick = async () => {
    playTapSound();
    // Copy to clipboard first as fail-safe
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 no-print animate-fade">
      <div 
        className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-[#06C755] text-white flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight truncate">
                ส่งสรุปเข้า LINE
              </h2>
              <p className="text-xs text-white/90 truncate">
                {title}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-black/15 hover:bg-black/25 flex items-center justify-center text-white cursor-pointer flex-shrink-0"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          
          {/* Action Buttons */}
          <div className="space-y-2">
            {/* 1. Direct LINE Link (Anchor tag bypasses popup blockers 100%) */}
            <a
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLineClick}
              className="btn-tactile w-full py-3 px-4 rounded-2xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>เปิดส่งในแอป LINE ทันที</span>
            </a>

            {/* 2. Copy to Clipboard Button */}
            <button
              onClick={handleCopy}
              className={`btn-tactile w-full py-2.5 px-4 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                copied
                  ? 'bg-emerald-50 border-emerald-500 text-[#2D6A4F]'
                  : 'bg-white border-stone-300 hover:border-stone-400 text-stone-800'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>คัดลอกข้อความแล้ว! นำไปวางใน LINE ได้เลย</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-600" />
                  <span>คัดลอกข้อความสรุป (เพื่อไปวางในแชท)</span>
                </>
              )}
            </button>

            {/* 3. Mobile System Share Sheet */}
            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                className="btn-tactile w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-stone-600" />
                <span>แชร์ผ่านเมนูของมือถือ (ส่งแอปอื่น)</span>
              </button>
            )}
          </div>

          {/* Help tip for elderly */}
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
            <p className="font-bold text-stone-800">
              💡 วิธีส่งง่ายๆ:
            </p>
            <ol className="list-decimal pl-4 space-y-0.5 text-stone-600">
              <li>กดปุ่มสีเขียว <strong>"เปิดส่งในแอป LINE ทันที"</strong> ด้านบน</li>
              <li>หรือกด <strong>"คัดลอกข้อความ"</strong> แล้วเปิดแชท LINE ไปกด <strong>"วาง (Paste)"</strong> ได้เลยครับ</li>
            </ol>
          </div>

          {/* Preview of the formatted text */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700">
              ตัวอย่างข้อความที่จะส่ง:
            </label>
            <pre className="p-3 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-800 font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto select-all">
              {text}
            </pre>
          </div>

        </div>

        {/* Footer Close */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex-shrink-0 text-center">
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-full py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs sm:text-sm cursor-pointer"
          >
            ปิดหน้าต่างนี้
          </button>
        </div>

      </div>
    </div>
  );
}
