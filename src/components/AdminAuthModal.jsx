import React, { useState, useEffect } from 'react';
import { X, Mail, Check, RotateCw, AlertCircle } from 'lucide-react';
import { playTapSound, playSuccessSound, playDeleteSound, speakThai } from '../utils/audio';
import { sendAdminEmailOtp, verifyAdminEmailOtp, DEFAULT_ADMIN_EMAIL } from '../services/adminAuthService';

export default function AdminAuthModal({
  isOpen,
  adminPin = '9999',
  adminEmail = DEFAULT_ADMIN_EMAIL,
  onClose,
  onSuccess,
  title = 'ยืนยันสิทธิ์แอดมิน (Admin Only)',
  description = 'เฉพาะผู้ดูแลบ้านเท่านั้น เพื่อความปลอดภัย ระบบจะส่งรหัสผ่านไปยังอีเมลแอดมิน'
}) {
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'pin'
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  // 1. Send OTP to tharanut@gmail.com
  const handleSendOtp = async () => {
    playTapSound();
    setLoading(true);
    setErrorMsg('');
    setSuccessNotice('');

    try {
      await sendAdminEmailOtp(adminEmail);
      playSuccessSound();
      setOtpSent(true);
      setCountdown(60);
      setSuccessNotice(`ส่งรหัส OTP 6 ตัวไปยัง ${adminEmail} เรียบร้อยแล้วครับ`);
      speakThai('ส่งรหัสโอทีพีไปที่อีเมลเรียบร้อยแล้วครับ กรุณาเปิดดูในกล่องจดหมายครับ');
    } catch (err) {
      playDeleteSound();
      setErrorMsg(err.message || 'ส่งรหัส OTP ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify 6-digit OTP
  const handleVerifyOtp = async (codeToVerify = otpCode) => {
    const clean = codeToVerify.trim();
    if (clean.length < 6) {
      setErrorMsg('กรุณากรอกรหัส OTP ให้ครบ 6 ตัวครับ');
      return;
    }

    playTapSound();
    setLoading(true);
    setErrorMsg('');

    try {
      await verifyAdminEmailOtp(clean, adminEmail);
      playSuccessSound();
      speakThai('ยืนยันตัวตนแอดมินสำเร็จแล้วครับ');
      onSuccess();
    } catch (err) {
      playDeleteSound();
      setErrorMsg(err.message || 'รหัส OTP ไม่ถูกต้องครับ');
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify Fallback 4-digit PIN
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
          setErrorMsg('รหัส PIN แอดมินไม่ถูกต้องครับ (รหัสเริ่มต้น: 9999)');
          setPinCode('');
        }
      }, 200);
    }
  };

  // Tactile keypad press for OTP
  const handleOtpDigitPress = (digit) => {
    playTapSound();
    if (otpCode.length >= 6) return;
    const next = otpCode + String(digit);
    setOtpCode(next);
    setErrorMsg('');
    if (next.length === 6) {
      handleVerifyOtp(next);
    }
  };

  const handleOtpBackspace = () => {
    playTapSound();
    if (otpCode.length > 0) {
      setOtpCode(otpCode.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleOtpClear = () => {
    playTapSound();
    setOtpCode('');
    setErrorMsg('');
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
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black truncate font-['Prompt']">
                  {title}
                </h3>
              </div>
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
        <div className="p-4 sm:p-6 space-y-4">
          {/* Target Admin Email Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-3 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-lg text-amber-700 shrink-0 shadow-2xs">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-amber-900 block">
                อีเมลแอดมินผู้ดูแลระบบ:
              </span>
              <span className="text-xs sm:text-sm font-bold text-stone-900 font-mono truncate block select-all">
                {adminEmail}
              </span>
            </div>
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

          {/* --- METHOD 1: EMAIL OTP FLOW (PRIMARY) --- */}
          {authMethod === 'email' && (
            <div className="space-y-4 text-center">
              {!otpSent ? (
                /* Step A: Request OTP Button */
                <div className="space-y-3 py-1">
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed text-left">
                    เพื่อป้องกันไม่ให้ผู้อื่นเข้าจัดการบัญชีบ้านได้ ระบบจะส่งรหัสผ่านใช้ครั้งเดียว (OTP 6 หลัก) ไปยังอีเมล <strong>{adminEmail}</strong>
                  </p>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="btn-tactile w-full py-3.5 px-4 rounded-2xl bg-[#2D6A4F] hover:bg-[#23533E] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>กำลังส่งรหัสไปยังอีเมล...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        <span>ส่งรหัส OTP ไปที่ {adminEmail}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Step B: Enter 6-digit OTP received in email */
                <div className="space-y-3">
                  <div className="text-left space-y-1">
                    <span className="text-xs font-bold text-stone-800 block">
                      กรอกรหัส OTP 6 ตัวที่ได้รับในอีเมล:
                    </span>
                    <p className="text-[11px] text-stone-500">
                      ตรวจสอบในกล่องข้อความหรือโฟลเดอร์ Junk/Spam
                    </p>
                  </div>

                  {/* 6-digit Visual Boxes */}
                  <div className="flex justify-center items-center gap-2 sm:gap-2.5 py-1">
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const val = otpCode[idx] || '';
                      return (
                        <div
                          key={idx}
                          className={`w-10 h-12 sm:w-12 sm:h-14 rounded-2xl border-2 flex items-center justify-center text-xl sm:text-2xl font-bold font-mono transition-all ${
                            val
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs scale-105'
                              : 'border-stone-300 bg-stone-50 text-stone-400'
                          }`}
                        >
                          {val || '•'}
                        </div>
                      );
                    })}
                  </div>

                  {/* Resend button / Countdown */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    {countdown > 0 ? (
                      <span className="text-stone-400 text-[11px]">
                        ส่งรหัสใหม่ได้ในอีก {countdown} วินาที
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer text-xs flex items-center gap-1"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>ส่งรหัสใหม่อีกครั้ง</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleVerifyOtp()}
                      disabled={otpCode.length < 6 || loading}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                      {loading ? 'กำลังตรวจ...' : 'ยืนยันรหัส'}
                    </button>
                  </div>

                  {/* Tactile Keypad for entering 6 digits */}
                  <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto pt-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleOtpDigitPress(digit)}
                        className="btn-tactile h-11 sm:h-12 rounded-xl bg-[#FAF9F5] hover:bg-stone-200 border border-stone-200 text-stone-900 text-lg font-bold font-['Prompt'] flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleOtpClear}
                      className="btn-tactile h-11 sm:h-12 rounded-xl bg-stone-100 text-stone-500 text-xs font-semibold flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      ล้าง
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOtpDigitPress(0)}
                      className="btn-tactile h-11 sm:h-12 rounded-xl bg-[#FAF9F5] hover:bg-stone-200 border border-stone-200 text-stone-900 text-lg font-bold font-['Prompt'] flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleOtpBackspace}
                      className="btn-tactile h-11 sm:h-12 rounded-xl bg-stone-100 text-stone-600 text-xs font-semibold flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              )}

              {/* Alternative to switch to Master PIN */}
              <div className="pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setAuthMethod('pin');
                    setErrorMsg('');
                  }}
                  className="text-stone-500 hover:text-stone-800 text-xs font-medium underline cursor-pointer"
                >
                  🔑 หรือใช้รหัส PIN แอดมินสำรอง (ออฟไลน์)
                </button>
              </div>
            </div>
          )}

          {/* --- METHOD 2: 4-DIGIT MASTER PIN FALLBACK --- */}
          {authMethod === 'pin' && (
            <div className="space-y-4 text-center">
              <div className="text-left space-y-1">
                <span className="text-xs font-bold text-stone-800 block">
                  กรอกรหัส PIN แอดมิน 4 ตัว:
                </span>
                <p className="text-[11px] text-stone-500">
                  สำหรับกรณีฉุกเฉินหรือไม่มีอินเทอร์เน็ต
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
                >
                  ลบ
                </button>
              </div>

              {/* Back to Email OTP */}
              <div className="pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setAuthMethod('email');
                    setErrorMsg('');
                  }}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline cursor-pointer"
                >
                  ← ยืนยันรหัสผ่านผ่านอีเมล ({adminEmail})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
