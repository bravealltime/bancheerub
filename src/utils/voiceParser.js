// Smart Thai Voice Parser for Elderly & Family Ledger
// Accurately extracts:
// 1. Transaction Type (Income vs Expense)
// 2. Numerical Amount (both digits and spoken Thai numbers e.g. "ห้าสิบ", "สองร้อยห้าสิบ", "พันห้า")
// 3. Category ID matching the family ledger
// 4. Clean meaningful note

const THAI_NUMERALS = { '๐': 0, '๑': 1, '๒': 2, '๓': 3, '๔': 4, '๕': 5, '๖': 6, '๗': 7, '๘': 8, '๙': 9 };

export function parseThaiNumberWords(text) {
  if (!text) return 0;

  // 1. Convert Thai digits to Arabic digits
  let normalized = text.replace(/[๐-๙]/g, ch => THAI_NUMERALS[ch]);

  // 2. Check for explicit numbers (e.g., 50, 100, 1,500, 20.50)
  const digitMatch = normalized.match(/(\d[\d,]*(\.\d+)?)/);
  if (digitMatch) {
    const val = parseFloat(digitMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0) return val;
  }

  // 3. Parse spoken Thai numbers (e.g. "สองร้อยห้าสิบ", "พันห้า", "แปดสิบ", "ร้อยนึง")
  let total = 0;
  let remaining = normalized;

  // Millions (ล้าน)
  const millionMatch = remaining.match(/(หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)?ล้าน/);
  if (millionMatch) {
    const digitNames = { 'หนึ่ง': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5, 'หก': 6, 'เจ็ด': 7, 'แปด': 8, 'เก้า': 9 };
    const mult = millionMatch[1] ? digitNames[millionMatch[1]] : 1;
    total += mult * 1000000;
    remaining = remaining.substring(millionMatch.index + millionMatch[0].length);
  }

  // Ten thousands (หมื่น)
  const tenThousandMatch = remaining.match(/(หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)?หมื่น/);
  if (tenThousandMatch) {
    const digitNames = { 'หนึ่ง': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5, 'หก': 6, 'เจ็ด': 7, 'แปด': 8, 'เก้า': 9 };
    const mult = tenThousandMatch[1] ? digitNames[tenThousandMatch[1]] : 1;
    total += mult * 10000;
    remaining = remaining.substring(tenThousandMatch.index + tenThousandMatch[0].length);
  }

  // Thousands (พัน)
  const thousandMatch = remaining.match(/(หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)?พัน(นึง)?/);
  if (thousandMatch) {
    const digitNames = { 'หนึ่ง': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5, 'หก': 6, 'เจ็ด': 7, 'แปด': 8, 'เก้า': 9 };
    const mult = thousandMatch[1] ? digitNames[thousandMatch[1]] : 1;
    total += mult * 1000;
    remaining = remaining.substring(thousandMatch.index + thousandMatch[0].length);

    // Common Thai colloquial: "พันห้า" -> 1,500
    if (remaining.startsWith('ห้า') && !remaining.includes('ร้อย') && !remaining.includes('สิบ')) {
      total += 500;
      remaining = remaining.substring(3);
    }
  }

  // Hundreds (ร้อย / ร้อยนึง)
  const hundredMatch = remaining.match(/(หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)?(ร้อย|ร้อยนึง)/);
  if (hundredMatch) {
    const digitNames = { 'หนึ่ง': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5, 'หก': 6, 'เจ็ด': 7, 'แปด': 8, 'เก้า': 9 };
    const mult = hundredMatch[1] ? digitNames[hundredMatch[1]] : 1;
    total += mult * 100;
    remaining = remaining.substring(hundredMatch.index + hundredMatch[0].length);

    // Common Thai colloquial: "ร้อยห้า" -> 150
    if (remaining.startsWith('ห้า') && !remaining.includes('สิบ')) {
      total += 50;
      remaining = remaining.substring(3);
    }
  }

  // Tens (สิบ / ยี่สิบ / สามสิบ... เก้าสิบ)
  const tenMatch = remaining.match(/(ยี่|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|หนึ่ง)?สิบ/);
  if (tenMatch) {
    const tenNames = { 'หนึ่ง': 10, 'ยี่': 20, 'สาม': 30, 'สี่': 40, 'ห้า': 50, 'หก': 60, 'เจ็ด': 70, 'แปด': 80, 'เก้า': 90 };
    const val = tenMatch[1] ? (tenNames[tenMatch[1]] || 10) : 10;
    total += val;
    remaining = remaining.substring(tenMatch.index + tenMatch[0].length);
  }

  // Units (เอ็ด, หนึ่ง, สอง, สาม...)
  const unitMatch = remaining.match(/(เอ็ด|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)/);
  if (unitMatch) {
    const unitNames = { 'เอ็ด': 1, 'หนึ่ง': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5, 'หก': 6, 'เจ็ด': 7, 'แปด': 8, 'เก้า': 9 };
    total += unitNames[unitMatch[1]] || 0;
  }

  return total;
}

export function parseThaiVoiceInput(transcript) {
  if (!transcript || typeof transcript !== 'string') return null;

  const text = transcript.trim();
  const lower = text.toLowerCase();

  // 1. Extract Amount
  const amount = parseThaiNumberWords(text);

  // 2. Determine Type: Income vs Expense
  // Explicit Expense patterns: "ให้เงินลูก", "ซื้อ...", "จ่าย...", "ค่ายา", "ค่าไฟ"
  const isGivingToChild = /ให้(เงิน)?(ลูก|หลาน|เด็ก|คนอื่น|ทาน)/.test(lower);
  const isBuyingOrPaying = /ซื้อ|สั่ง|จ่าย|เสีย|เติม|ซ่อม|โอนให้|ถอน/.test(lower);
  const isDirectExpenseWord = /ค่าน้ำ|ค่าไฟ|ค่าโทรศัพท์|ค่าเน็ต|ค่ารถ|ค่ายา|ค่าเทอม|ค่าหมอ|ค่าห้อง|ค่ารักษา|ค่าเดินทาง/.test(lower);

  // Explicit Income patterns: "ลูกให้", "หลานโอน", "เงินเดือน", "บำนาญ", "ขายได้"
  const isIncomeGiver = /(ลูก|หลาน|พ่อ|แม่|พี่|น้อง|ตา|ยาย|เขา|เพื่อน|นาย|ลูกค้า|อบต|รัฐ|ราชการ)(ให้|โอน|แจก|จ่ายให้|ส่งให้)/.test(lower);
  const isIncomeSource = /เงินเดือน|บำนาญ|เบี้ย|คนแก่|คนชรา|ผู้สูงอายุ|เงินทอน|ดอกเบี้ย|ปันผล|ถูกหวย|รางวัล|ลอตเตอรี่|สลาก/.test(lower);
  const isSelling = /ขาย|รับจ้าง|ค่าจ้าง|รายได้/.test(lower);
  const isMoneyIn = /เงินเข้า|โอนเข้า|ได้เงิน|รับเงิน|ได้รับ|มีคนโอน|เงินโอนเข้า/.test(lower);

  let type = 'expense';
  let categoryId = 'food';

  // Decision Tree: If NOT an explicit expense action, check income triggers
  if (!isGivingToChild && !isBuyingOrPaying && !isDirectExpenseWord && (isIncomeGiver || isIncomeSource || isSelling || isMoneyIn)) {
    type = 'income';

    if (isIncomeSource && /เบี้ย|บำนาญ|คนแก่|คนชรา|ผู้สูงอายุ/.test(lower)) {
      categoryId = 'pension';
    } else if (isIncomeGiver || /ลูก|หลาน/.test(lower)) {
      categoryId = 'family_income';
    } else if (/ผัก|ผลไม้|ไข่|สวน|ต้นไม้|ปลา|ไก่/.test(lower)) {
      categoryId = 'farm';
    } else if (/หวย|รางวัล|ลอตเตอรี่|สลาก/.test(lower)) {
      categoryId = 'lottery';
    } else if (/เงินเดือน|ค่าจ้าง|รับจ้าง|ขาย/.test(lower)) {
      categoryId = 'work';
    } else {
      categoryId = 'other_income';
    }
  } else {
    type = 'expense';

    // Prioritized Expense Categories
    if (/ยา|หมอ|คลินิก|โรงพยาบาล|หาหมอ|ป่วย|ตรวจ/.test(lower)) {
      categoryId = 'medicine';
    } else if (/น้ำมัน|รถ|แท็กซี่|เดินทาง|รถเมล์|วิน|บัส|ค่าโดยสาร|สองแถว/.test(lower)) {
      categoryId = 'travel';
    } else if (/ไฟ|ค่าน้ำ|ค่าน้ำประปา|โทรศัพท์|เน็ต|บิล|ค่าเช่า|ไวไฟ|ซิม/.test(lower)) {
      categoryId = 'bills';
    } else if (/บุญ|พระ|ใส่บาตร|สังฆทาน|บวช|ซอง|วัด|กฐิน|ผ้าป่า/.test(lower)) {
      categoryId = 'merit';
    } else if (isGivingToChild || /ให้ลูก|ให้หลาน/.test(lower)) {
      categoryId = 'family';
    } else if (/ตลาด|ของใช้|สบู่|ผงซักฟอก|ยาสระผม|กระดาษ|ยาสีฟัน/.test(lower)) {
      categoryId = 'groceries';
    } else if (/ผ้า|เสื้อ|กางเกง|ตัดผม|รองเท้า|กระเป๋า/.test(lower)) {
      categoryId = 'clothes';
    } else if (/บ้าน|ซ่อม|ก๊อก|หลังคา|ท่อ/.test(lower)) {
      categoryId = 'home';
    } else {
      categoryId = 'food';
    }
  }

  // 3. Extract Clean Note
  let cleanNote = text;
  if (amount > 0) {
    // Remove digits and spoken number words to leave only the action description
    cleanNote = cleanNote
      .replace(new RegExp(String(amount), 'g'), '')
      .replace(/[๐-๙\d,]+/g, '')
      .replace(/(ร้อยนึง|พันนึง|พันห้า|ร้อยห้า)/g, '')
      .replace(/(หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)?(หมื่น|พัน|ร้อย|สิบ)/g, '')
      .replace(/(ยี่สิบ|เอ็ด|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)/g, '')
      .replace(/(บาท|฿)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // If note became too short or empty, keep original text
  if (!cleanNote || cleanNote.length < 2) {
    cleanNote = text;
  }

  return {
    type,
    categoryId,
    amount: amount > 0 ? amount : 0,
    note: cleanNote
  };
}
