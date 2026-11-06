import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { playTapSound } from '../utils/audio';

export default function InstallPromptBanner() {
  const [showBanner, setShowBanner] = useState(() => {
    return !localStorage.getItem('banchee_install_dismissed');
  });
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleDismiss = () => {
    playTapSound();
    setShowBanner(false);
    localStorage.setItem('banchee_install_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    playTapSound();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  if (!showBanner && !showGuideModal) return null;

  return (
    <>
      {showBanner && !showGuideModal && (
        <div className="bg-[#EFECE6] border border-stone-300 rounded-2xl p-3 mb-3 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl">📱</span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                เก็บบัญชีนี้ไว้บนหน้าจอมือถือ
              </div>
              <div className="text-[11px] sm:text-xs text-stone-600 truncate">
                เปิดกดใช้งานง่ายๆ เหมือนแอปทั่วไป
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="btn-tactile px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs cursor-pointer"
            >
              วิธีติดตั้ง
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
              aria-label="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-stone-300 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">
                วิธีนำไปไว้บนหน้าจอมือถือ
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-stone-700 text-xs sm:text-sm">
              <div className="bg-[#FAF9F5] p-3 rounded-xl border border-stone-200">
                <p className="font-bold text-stone-900 mb-1">สำหรับ iPhone (Safari):</p>
                <ol className="list-decimal list-inside space-y-1 text-stone-600">
                  <li>กดปุ่ม <strong>แชร์</strong> ด้านล่างจอ</li>
                  <li>เลือก <strong>"เพิ่มไปยังหน้าจอโฮม"</strong></li>
                  <li>กด <strong>"เพิ่ม"</strong> มุมขวาบน</li>
                </ol>
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded-xl border border-stone-200">
                <p className="font-bold text-stone-900 mb-1">สำหรับ Android (Chrome):</p>
                <ol className="list-decimal list-inside space-y-1 text-stone-600">
                  <li>กดปุ่ม <strong>จุดสามจุด (⋮)</strong> มุมขวาบน</li>
                  <li>เลือก <strong>"เพิ่มลงในหน้าจอหลัก"</strong></li>
                  <li>กดยืนยัน <strong>"ติดตั้ง"</strong></li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="btn-tactile w-full py-2 rounded-xl bg-stone-800 text-white font-bold text-xs sm:text-sm cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
