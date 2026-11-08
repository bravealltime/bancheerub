import React, { useState, useEffect } from 'react';
import { X, Mail, Check, RotateCw, AlertCircle, KeyRound } from 'lucide-react';
import { playTapSound, playSuccessSound, playDeleteSound, speakThai } from '../utils/audio';
import { sendAdminEmailOtp, DEFAULT_ADMIN_EMAIL } from '../services/adminAuthService';

export default function AdminAuthModal({
  isOpen,
  adminPin = '9999',
  adminEmail = DEFAULT_ADMIN_EMAIL,
  onClose,
  onSuccess,
  title = 'ยืนยันสิทธิ์แอดมิน (Admin Only)',
  description = 'เฉพาะผู้ดูแลบ้านเท่านั้น เพื่อป้องกันไม่ให้คนอื่นเข้ามาจัดการระบบ'
}) {
  const [authMethod, setAuthMethod] = useState('pin'); // 'pin' | 'email'
  const [emailSent, setEmailSent] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Countdown timer for email resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  // 1. Send Magic Link Email to tharanut@gmail.com
  const handleSendEmailLink = async () => {
    playTapSound();
    setLoading(true);
    setErrorMsg('');
    setSuccessNotice('');

    try {
      await sendAdminEmailOtp(adminEmail);
      playSuccessSound();
      setEmailSent(true);
      setCountdown(60);
      setSuccessNotice(`ส่งอีเมลยืนยันไปยัง ${adminEmail} เรียบร้อยแล้วครับ`);
      speakThai('ส่งลิงก์ยืนยันไปที่อีเมลเรียบร้อยแล้วครับ กรุณากดปุ่มในอีเมลเพื่อเข้าสู่ระบบครับ');
    } catch (err) {
      playDeleteSound();
      setErrorMsg(err.message || 'ส่งอีเมลไม่สำเร็จ กรุณาใช้รหัส PIN แทนครับ');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify 4-digit PIN (Immediate unlock)
  const handleVerifyPin = (digit) => {
    playTapSound();
    if (pinCode.length >= 4) return;

    const newPin = pinCode + String(digit);
    setPinCode(newPin);
    setErrorMsg('');

    if (newPin.length === 4) {
      setTimeout(() => {
        if (newPin === String(adminPin)) {
          playSuccessSound();
          speakThai('ยืนยันรหัสแอดมินถูกต้องครับ');
          setPinCode('');
          onSuccess();
        } else {
          playDeleteSound();
          setErrorMsg('รหัส PIN แอดมินไม่ถูกต้องครับ (รหัสเริ่มต้นคือ 9999)');
          setPinCode('');
        }
      }, 200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3.5 sm:p-4 no-print animate-fade overflow-y-auto">
      <div
        className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl border-2 border-amber-300 shadow-2xl overflow-hidden flex flex-col my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#1C2D27] via-[#263D34] to-[#1C2D27] text-white p-4 sm:p-5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shrink-0">
              👑
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black truncate font-['Prompt']">
                {title}
              </h3>
              <p className="text-xs text-emerald-200/80 truncate">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Target Admin Email Banner */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-2.5 flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-semibold text-amber-900 block">
                อีเมลผู้ดูแลบ้าน (Admin):
              </span>
              <span className="text-xs font-bold text-stone-900 font-mono truncate block select-all">
                {adminEmail}
              </span>
            </div>
          </div>

          {/* 2-Way Tab Selector */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setAuthMethod('pin');
                setErrorMsg('');
              }}
              className={`py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMethod === 'pin'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>ใส่รหัส PIN (ทันที)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTapSound();
                setAuthMethod('email');
                setErrorMsg('');
              }}
              className={`py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMethod === 'email'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>ส่งลิงก์เข้าอีเมล</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 text-left animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Notice */}
          {successNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 text-left">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* --- METHOD 1: 4-DIGIT PIN (FASTEST, NO WAITING) --- */}
          {authMethod === 'pin' && (
            <div className="space-y-3 text-center">
              <div className="text-left space-y-0.5">
                <span className="text-xs font-bold text-stone-900 block">
                  กรอกรหัส PIN แอดมิน 4 ตัว:
                </span>
                <p className="text-[11px] text-stone-500">
                  ปลดล็อคเข้าใช้งานได้ทันที (รหัสเริ่มต้น: 9999 เปลี่ยนได้ในตั้งค่า)
                </p>
              </div>

              {/* 4 dots */}
              <div className="flex justify-center items-center gap-3 py-1">
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = idx < pinCode.length;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        isFilled
                          ? 'bg-amber-600 border-amber-600 scale-110 shadow-xs'
                          : 'border-stone-300 bg-stone-100'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleVerifyPin(digit)}
                    className="btn-tactile h-11 sm:h-12 rounded-xl bg-[#FAF9F5] hover:bg-stone-200 border border-stone-200 text-stone-900 text-lg font-bold font-['Prompt'] flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setPinCode('');
                    setErrorMsg('');
                  }}
                  className="btn-tactile h-11 sm:h-12 rounded-xl bg-stone-100 text-stone-500 text-xs font-semibold flex items-center justify-center cursor-pointer active:scale-95"
                >
                  ล้าง
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyPin(0)}
                  className="btn-tactile h-11 sm:h-12 rounded-xl bg-[#FAF9F5] hover:bg-stone-200 border border-stone-200 text-stone-900 text-lg font-bold font-['Prompt'] flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    if (pinCode.length > 0) setPinCode(pinCode.slice(0, -1));
                    setErrorMsg('');
                  }}
                  className="btn-tactile h-11 sm:h-12 rounded-xl bg-stone-100 text-stone-600 text-xs font-semibold flex items-center justify-center cursor-pointer active:scale-95"
                  aria-label="ลบตัวเลข"
                >
                  ลบ
                </button>
              </div>
            </div>
          )}

          {/* --- METHOD 2: EMAIL LINK TO tharanut@gmail.com --- */}
          {authMethod === 'email' && (
            <div className="space-y-3 text-center">
              {!emailSent ? (
                <div className="space-y-3 py-1">
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-left space-y-1.5">
                    <p className="text-xs text-stone-700 leading-relaxed">
                      ระบบจะส่งอีเมลยืนยันตัวตนไปยัง <strong>{adminEmail}</strong>
                    </p>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                      💡 <strong>วิธีใช้งาน:</strong> ในอีเมลจะไม่มีตัวเลขส่งมาครับ เมื่อได้รับอีเมลแล้ว ให้กดปุ่ม <u>"Confirm email address"</u> ในอีเมล จะเป็นการเปิดแอปและเข้าสู่โหมดแอดมินให้อัตโนมัติทันที
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendEmailLink}
                    disabled={loading}
                    className="btn-tactile w-full py-3.5 px-4 rounded-2xl bg-[#2D6A4F] hover:bg-[#23533E] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>กำลังส่งอีเมล...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        <span>ส่งลิงก์ยืนยันไปที่ {adminEmail}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 py-1 text-left">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                      <Mail className="w-4 h-4 text-emerald-600" />
                      <span>ส่งอีเมลเรียบร้อยแล้ว!</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      กรุณาเปิดอีเมล <strong>{adminEmail}</strong> แล้วแตะปุ่ม <u>Confirm email address</u> ในอีเมล ระบบจะเปิดแอปและปลดล็อคสิทธิ์แอดมินให้ทันทีครับ
                    </p>
                    <p className="text-[11px] text-stone-500">
                      *(หากหาไม่เจอ ให้ตรวจดูในโฟลเดอร์ Junk/Spam)*
                    </p>
                  </div>

                  {countdown > 0 ? (
                    <p className="text-xs text-stone-400 text-center">
                      ส่งใหม่อีกครั้งได้ในอีก {countdown} วินาที
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendEmailLink}
                      disabled={loading}
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer text-xs flex items-center justify-center gap-1 mx-auto"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>ส่งลิงก์ใหม่อีกครั้ง</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
