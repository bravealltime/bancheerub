import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { playTapSound, playSuccessSound } from '../utils/audio';

const TUTORIAL_STEPS = [
  {
    stepNumber: 1,
    badge: 'ยินดีต้อนรับ',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    title: 'ยินดีต้อนรับสู่ "สมุดเงินทอง"',
    subtitle: 'สมุดบันทึกรายรับ-รายจ่ายที่ออกแบบมาเพื่อครอบครัวและผู้สูงวัยโดยเฉพาะ',
    icon: '📒',
    highlights: [
      {
        icon: '👀',
        title: 'ตัวหนังสือใหญ่ สบายตา',
        desc: 'ปรับขนาดตัวอักษรได้ถึง 3 ระดับ ไม่ต้องเพ่ง'
      },
      {
        icon: '🔒',
        title: 'ปลอดภัย เป็นส่วนตัว 100%',
        desc: 'ข้อมูลเก็บไว้ในเครื่องคุณเท่านั้น ไม่ส่งออกไปนอกเครื่อง'
      },
      {
        icon: '📶',
        title: 'ไม่ต้องต่อเน็ตก็ใช้ได้',
        desc: 'จดบันทึกได้ทุกที่ทุกเวลา แม้ไม่มีสัญญาณอินเทอร์เน็ต'
      }
    ]
  },
  {
    stepNumber: 2,
    badge: 'ขั้นตอนที่ 1',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    title: 'เลือกสมุดของตัวเอง & ใส่รหัส PIN',
    subtitle: 'แยกสมุดของแต่ละคนในบ้านอย่างชัดเจน',
    icon: '👵👴',
    highlights: [
      {
        icon: '🏠',
        title: 'แยกสมุดของแต่ละคน',
        desc: 'มีทั้งสมุดของคุณตา, คุณยาย, กองกลางบ้าน และลูกหลาน'
      },
      {
        icon: '🔐',
        title: 'รหัส 4 ตัวเพื่อความเป็นส่วนตัว',
        desc: 'คุณตา (1111) • คุณยาย (2222) • กองกลาง (0000) • ลูกหลาน (3333)'
      },
      {
        icon: '🛡️',
        title: 'รหัสแอดมิน (9999)',
        desc: 'ใช้ปลดล็อคเข้าดูได้ทุกสมุด เผื่อผู้สูงอายุลืมรหัส'
      }
    ]
  },
  {
    stepNumber: 3,
    badge: 'ขั้นตอนที่ 2',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    title: 'วิธีจดเงินออก และ เงินเข้า',
    subtitle: 'จดง่ายใน 3 วินาที แตะไม่กี่ครั้งก็เสร็จ',
    icon: '📝',
    highlights: [
      {
        icon: '🔴',
        title: 'ปุ่มสีแดง = จดเงินออก (รายจ่าย)',
        desc: 'แตะเพื่อบันทึกค่ากับข้าว ค่ายา ซื้อของใช้ ค่าไฟ'
      },
      {
        icon: '🟢',
        title: 'ปุ่มสีเขียว = จดเงินเข้า (รายรับ)',
        desc: 'แตะเมื่อได้เบี้ยคนแก่ ลูกหลานให้เงิน หรือเงินค้าขาย'
      },
      {
        icon: '🎙️',
        title: 'สั่งด้วยเสียงได้',
        desc: 'แตะไอคอนรูปไมค์แล้วพูด เช่น "ซื้อกับข้าว 80 บาท"'
      }
    ]
  },
  {
    stepNumber: 4,
    badge: 'ขั้นตอนที่ 3',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    title: 'รวมยอดให้อัตโนมัติ & ฟังเสียงอ่าน',
    subtitle: 'ไม่ต้องคิดเลขเอง มีเสียงพูดภาษาไทยคอยบอก',
    icon: '🔊',
    highlights: [
      {
        icon: '💰',
        title: 'คำนวณเงินคงเหลือให้เอง',
        desc: 'แสดงยอดเงินเข้า-ออกของวันนี้ และของทั้งเดือนชัดเจน'
      },
      {
        icon: '📢',
        title: 'ปุ่ม "ฟังสรุป" อ่านออกเสียง',
        desc: 'แตะปุ่มรูปลำโพงเพื่อให้ระบบอ่านยอดเงินให้ฟังได้'
      },
      {
        icon: '📊',
        title: 'สรุปรายเดือน & สั่งพิมพ์ A4',
        desc: 'ดูสรุปเป็นหมวดหมู่ และกดพิมพ์กระดาษ A4 ไว้ยื่นภาษีหรือเก็บได้'
      }
    ]
  },
  {
    stepNumber: 5,
    badge: 'ขั้นตอนที่ 4',
    badgeColor: 'bg-green-100 text-green-800 border-green-300',
    title: 'ส่งเข้า LINE & สลับสมุดคนในบ้าน',
    subtitle: 'ให้ลูกหลานช่วยตรวจดู หรือสลับไปดูคนอื่นได้ตลอดเวลา',
    icon: '💬',
    highlights: [
      {
        icon: '📲',
        title: 'ปุ่ม "แชร์ LINE"',
        desc: 'ส่งสรุปยอดเงินเข้าห้องแชท LINE ให้ลูกหลานตรวจดูได้ในคลิกเดียว'
      },
      {
        icon: '🔄',
        title: 'ปุ่ม "สลับคน"',
        desc: 'อยู่มุมบนซ้าย แตะเพื่อกลับไปหน้าเลือกสมุดของคนอื่น'
      },
      {
        icon: '⚙️',
        title: 'ปรับขนาดตัวอักษรและตั้งค่า',
        desc: 'แตะไอคอนฟันเฟืองเพื่อเปลี่ยนรหัส PIN หรือเปลี่ยนขนาดตัวหนังสือ'
      }
    ]
  }
];

export default function OnboardingTutorialModal({
  isOpen,
  onClose
}) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    playTapSound();
    if (isLast) {
      playSuccessSound();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    playTapSound();
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    playTapSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 no-print animate-fade overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 bg-[#2D3A34] text-white flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/20">
              คู่มือแนะนำการใช้งาน ({currentStep + 1}/{TUTORIAL_STEPS.length})
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="text-xs text-stone-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 cursor-pointer flex items-center gap-1"
          >
            <span>ข้ามคำแนะนำ</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-stone-100 h-1.5 flex flex-shrink-0">
          {TUTORIAL_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 transition-all duration-300 ${
                idx <= currentStep ? 'bg-[#2D6A4F]' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Main Visual & Title */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[#F6F4EF] border border-stone-300 flex items-center justify-center text-4xl mx-auto shadow-xs">
              {step.icon}
            </div>

            <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mb-1">
              <span className={`px-2 py-0.5 rounded-md ${step.badgeColor}`}>
                {step.badge}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-['Prompt']">
              {step.title}
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
              {step.subtitle}
            </p>
          </div>

          {/* Highlights List */}
          <div className="space-y-2.5 pt-1">
            {step.highlights.map((item, idx) => (
              <div
                key={idx}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#FAF9F5] border border-stone-200 flex items-start gap-3 shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-stone-300 flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
                  {item.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-stone-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Navigation Buttons */}
        <div className="p-3.5 sm:p-4 bg-[#FAF9F5] border-t border-stone-200 flex items-center justify-between gap-2 flex-shrink-0">
          {!isFirst ? (
            <button
              onClick={handlePrev}
              className="btn-tactile px-3.5 sm:px-4 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับ</span>
            </button>
          ) : (
            <div className="w-16" />
          )}

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {TUTORIAL_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  playTapSound();
                  setCurrentStep(idx);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? 'w-6 bg-[#2D6A4F]'
                    : 'w-2 bg-stone-300 hover:bg-stone-400'
                }`}
                aria-label={`ไปขั้นตอนที่ ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className={`btn-tactile px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isLast
                ? 'bg-[#2D6A4F] hover:bg-[#23533E]'
                : 'bg-stone-800 hover:bg-stone-900'
            }`}
          >
            <span>{isLast ? 'เริ่มใช้งานเลย!' : 'ถัดไป'}</span>
            {isLast ? <Check className="w-4 h-4 stroke-[3]" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
}
