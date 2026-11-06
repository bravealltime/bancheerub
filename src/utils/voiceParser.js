// Thai voice sentence parser for elderly income/expense logging

export function parseThaiVoiceInput(transcript) {
  if (!transcript || typeof transcript !== 'string') return null;

  const text = transcript.trim();

  // 1. Extract numbers
  // Matches Arabic digits e.g. "50", "100", "1500" or Thai digits "๑๐๐"
  const thaiNumerals = { '๐': 0, '๑': 1, '๒': 2, '๓': 3, '๔': 4, '๕': 5, '๖': 6, '๗': 7, '๘': 8, '๙': 9 };
  let normalizedText = text.replace(/[๐-๙]/g, ch => thaiNumerals[ch]);

  // Handle Thai word numbers like "หนึ่งร้อย", "ห้าสิบ", "พัน", etc.
  // First look for standard numbers
  const numberMatch = normalizedText.match(/(\d+(?:\.\d+)?)/);
  let amount = 0;
  if (numberMatch) {
    amount = parseFloat(numberMatch[1]);
  } else {
    // Try simple word matching
    if (normalizedText.includes('ร้อย')) {
      const match = normalizedText.match(/(หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)?ร้อย/);
      const digitMap = { 'หนึ่ง': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5, 'หก': 6, 'เจ็ด': 7, 'แปด': 8, 'เก้า': 9 };
      const mul = match && match[1] ? digitMap[match[1]] : 1;
      amount = mul * 100;
    } else if (normalizedText.includes('พัน')) {
      const match = normalizedText.match(/(หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)?พัน/);
      const digitMap = { 'หนึ่ง': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5, 'หก': 6, 'เจ็ด': 7, 'แปด': 8, 'เก้า': 9 };
      const mul = match && match[1] ? digitMap[match[1]] : 1;
      amount = mul * 1000;
    }
  }

  // Determine type: income vs expense
  let type = 'expense'; // default to expense as it's the most common daily log
  let categoryId = 'food';

  const lower = normalizedText.toLowerCase();

  // Income indicators
  if (
    lower.includes('ได้เงิน') ||
    lower.includes('เงินเข้า') ||
    lower.includes('ลูกให้') ||
    lower.includes('หลานให้') ||
    lower.includes('บำนาญ') ||
    lower.includes('เบี้ย') ||
    lower.includes('เงินผู้สูงอายุ') ||
    lower.includes('ขายได้') ||
    lower.includes('ถูกหวย') ||
    lower.includes('รายรับ')
  ) {
    type = 'income';

    if (lower.includes('เบี้ย') || lower.includes('บำนาญ') || lower.includes('คนแก่')) {
      categoryId = 'pension';
    } else if (lower.includes('ลูก') || lower.includes('หลาน')) {
      categoryId = 'family_income';
    } else if (lower.includes('ผัก') || lower.includes('ผลไม้') || lower.includes('สวน') || lower.includes('ไข่')) {
      categoryId = 'farm';
    } else if (lower.includes('หวย') || lower.includes('รางวัล') || lower.includes('ลอตเตอรี่')) {
      categoryId = 'lottery';
    } else if (lower.includes('ขาย') || lower.includes('จ้าง') || lower.includes('เงินเดือน')) {
      categoryId = 'work';
    } else {
      categoryId = 'other_income';
    }
  } else {
    // Expense indicators
    type = 'expense';

    if (lower.includes('ยา') || lower.includes('หมอ') || lower.includes('คลินิก') || lower.includes('โรงพยาบาล')) {
      categoryId = 'medicine';
    } else if (lower.includes('ไฟ') || lower.includes('น้ำ') || lower.includes('โทรศัพท์') || lower.includes('เน็ต') || lower.includes('บิล')) {
      categoryId = 'bills';
    } else if (lower.includes('บุญ') || lower.includes('พระ') || lower.includes('ใส่บาตร') || lower.includes('สังฆทาน') || lower.includes('บวช') || lower.includes('ซอง')) {
      categoryId = 'merit';
    } else if (lower.includes('ให้ลูก') || lower.includes('ให้หลาน')) {
      categoryId = 'family';
    } else if (lower.includes('รถ') || lower.includes('น้ำมัน') || lower.includes('แท็กซี่') || lower.includes('เดินทาง')) {
      categoryId = 'travel';
    } else if (lower.includes('ตลาด') || lower.includes('ของใช้') || lower.includes('สบู่') || lower.includes('ผงซักฟอก')) {
      categoryId = 'groceries';
    } else if (lower.includes('ผ้า') || lower.includes('เสื้อ') || lower.includes('ตัดผม')) {
      categoryId = 'clothes';
    } else if (lower.includes('บ้าน') || lower.includes('ต้นไม้') || lower.includes('ซ่อม')) {
      categoryId = 'home';
    } else if (
      lower.includes('ข้าว') ||
      lower.includes('กิน') ||
      lower.includes('ก๋วยเตี๋ยว') ||
      lower.includes('กาแฟ') ||
      lower.includes('ขนม') ||
      lower.includes('อาหาร') ||
      lower.includes('กับข้าว')
    ) {
      categoryId = 'food';
    } else {
      categoryId = 'food'; // friendly default
    }
  }

  // Clean note
  let note = text;
  // If amount was found, we can keep the note as text or remove the number
  return {
    type,
    categoryId,
    amount: amount > 0 ? amount : 0,
    note: note
  };
}
