// Pre-defined categories specially designed for elderly Thai users

export const EXPENSE_CATEGORIES = [
  {
    id: 'food',
    name: 'กับข้าว / ของกิน',
    icon: '🍲',
    color: '#FEF3C7', // amber-100
    border: '#F59E0B', // amber-500
    quickNotes: ['กับข้าวตลาด', 'ข้าวมันไก่', 'ก๋วยเตี๋ยว', 'กาแฟ/ชา', 'ผลไม้', 'ขนมหวาน']
  },
  {
    id: 'groceries',
    name: 'ไปตลาด / ของใช้',
    icon: '🛒',
    color: '#E0F2FE', // sky-100
    border: '#0284C7', // sky-600
    quickNotes: ['ผักสด/เนื้อสัตว์', 'สบู่/ยาสระผม', 'ผงซักฟอก', 'ของใช้ในครัว', 'ทิชชู่']
  },
  {
    id: 'medicine',
    name: 'ค่ายา / หาหมอ',
    icon: '💊',
    color: '#FEE2E2', // rose-100
    border: '#E11D48', // rose-600
    quickNotes: ['ยาประจำตัว', 'หาหมอตามนัด', 'ยาดม/ยาหม่อง', 'ค่าตรวจเลือด', 'อาหารเสริม']
  },
  {
    id: 'bills',
    name: 'ค่าน้ำ / ค่าไฟ / เน็ต',
    icon: '💡',
    color: '#FEF9C3', // yellow-100
    border: '#CA8A04', // yellow-600
    quickNotes: ['ค่าไฟบ้าน', 'ค่าน้ำประปา', 'เติมเงินมือถือ', 'ค่าเน็ตบ้าน']
  },
  {
    id: 'merit',
    name: 'ทำบุญ / ช่วยงาน',
    icon: '🙏',
    color: '#FFEDD5', // orange-100
    border: '#EA580C', // orange-600
    quickNotes: ['ใส่บาตรเช้า', 'ทำบุญวัด', 'ซองช่วยงานบวช', 'ซองช่วยงานแต่ง', 'ปล่อยปลา']
  },
  {
    id: 'family',
    name: 'ให้ลูกหลาน',
    icon: '🎁',
    color: '#FCE7F3', // pink-100
    border: '#DB2777', // pink-600
    quickNotes: ['ให้หลานไปโรงเรียน', 'ของขวัญวันเกิด', 'ซื้อขนมให้หลาน', 'ช่วยลูก']
  },
  {
    id: 'travel',
    name: 'ค่ารถ / เดินทาง',
    icon: '🚗',
    color: '#EDE9FE', // violet-100
    border: '#7C3AED', // violet-600
    quickNotes: ['ค่าน้ำมันรถ', 'ค่าแท็กซี่/ตุ๊กตุ๊ก', 'ค่ารถสองแถว/เมล์', 'ค่ารถไฟ']
  },
  {
    id: 'home',
    name: 'บ้าน / ต้นไม้ / สวน',
    icon: '🏡',
    color: '#DCFCE7', // emerald-100
    border: '#16A34A', // emerald-600
    quickNotes: ['ซื้อปุ๋ย/ดิน', 'ต้นไม้ดอกไม้', 'ซ่อมก๊อกน้ำ', 'หลอดไฟใหม่']
  },
  {
    id: 'clothes',
    name: 'เสื้อผ้า / ของสวยงาม',
    icon: '👕',
    color: '#F3E8FF', // purple-100
    border: '#9333EA', // purple-600
    quickNotes: ['เสื้อใหม่', 'ผ้าถุง/กางเกง', 'รองเท้าใส่สบาย', 'ตัดผม']
  },
  {
    id: 'other_expense',
    name: 'ค่าใช้จ่ายอื่นๆ',
    icon: '📦',
    color: '#F3F4F6', // gray-100
    border: '#6B7280', // gray-500
    quickNotes: ['เบ็ดเตล็ด', 'ฝากซื้อของ']
  }
];

export const INCOME_CATEGORIES = [
  {
    id: 'pension',
    name: 'เบี้ยคนแก่ / บำนาญ',
    icon: '👴',
    color: '#DCFCE7', // green-100
    border: '#15803D', // green-700
    quickNotes: ['เบี้ยยังชีพผู้สูงอายุ', 'เงินบำนาญราชการ', 'เงินประกันสังคม']
  },
  {
    id: 'family_income',
    name: 'ลูกหลานให้เงิน',
    icon: '👨‍👩‍👦',
    color: '#FEF3C7', // amber-100
    border: '#D97706', // amber-600
    quickNotes: ['ลูกสาวโอนให้', 'ลูกชายให้', 'หลานให้ค่าขนม', 'แต๊ะเอีย']
  },
  {
    id: 'work',
    name: 'ค้าขาย / ทำงาน / ค่าจ้าง',
    icon: '💰',
    color: '#E0E7FF', // indigo-100
    border: '#4338CA', // indigo-700
    quickNotes: ['ขายของชำ', 'ขายอาหาร', 'รับจ้างเย็บผ้า', 'เงินเดือน']
  },
  {
    id: 'farm',
    name: 'ขายผลผลิต / การเกษตร',
    icon: '🌾',
    color: '#ECFCCB', // lime-100
    border: '#65A30D', // lime-600
    quickNotes: ['ขายผักสวนครัว', 'ขายผลไม้', 'ขายไข่ไก่', 'ขายต้นไม้']
  },
  {
    id: 'interest',
    name: 'ดอกเบี้ย / เงินปันผล',
    icon: '🏦',
    color: '#E0F2FE', // sky-100
    border: '#0369A1', // sky-700
    quickNotes: ['ดอกเบี้ยธนาคาร', 'เงินปันผลสหกรณ์', 'สลากออมสิน']
  },
  {
    id: 'lottery',
    name: 'ถูกหวย / โชคลาภ',
    icon: '🧧',
    color: '#FFE4E6', // rose-100
    border: '#BE123C', // rose-700
    quickNotes: ['ถูกลอตเตอรี่', 'ถูกรางวัลท้าย 2 ตัว', 'เงินของขวัญ']
  },
  {
    id: 'other_income',
    name: 'เงินเข้าอื่นๆ',
    icon: '✨',
    color: '#F3F4F6', // gray-100
    border: '#6B7280', // gray-500
    quickNotes: ['เพื่อนคืนเงิน', 'ขายของเก่า']
  }
];
