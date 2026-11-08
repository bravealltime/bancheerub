// Smart Thai AI Mathematical Accounting Parser for สมุดเงินทอง (Bancheerub)
// Specializes in parsing complex spoken/written Thai narrative bookkeeping sentences:
// - Multiplicative arithmetic: "20 ชิ้น ชิ้นละ 10 บาท" -> 20 × 10 = 200 บ.
// - Multi-item splitting: "กับหมูปิ้งอีก 10 ไม้ ไม้ละ 10 บาท" -> 10 × 10 = 100 บ.
// - Income detection: "โดยได้เงินมาจากคุณพ่อ 300 บาท" -> +300 บ.
// - Baseline / Starting balance: "เงินที่ตัวเองมีอยู่แล้ว 800 บาท" -> 800 บ.
// - Remaining balance query: "ตอนนี้เหลือเงินเท่าไหร่" -> computes 800 + 300 - 300 = 800 บ.

import { parseThaiNumberWords } from './voiceParser';

const CLASSIFIERS = [
  'ชิ้น', 'ไม้', 'ขวด', 'จาน', 'ชาม', 'กล่อง', 'ถุง', 'กิโลกรัม', 'กิโล', 'โล',
  'แผง', 'หวี', 'ตัว', 'ลูก', 'ผล', 'แก้ว', 'ห่อ', 'ซอง', 'กระป๋อง', 'มัด',
  'ใบ', 'แถว', 'ถัง', 'คัน', 'คู่', 'ชุด', 'ฟอง', 'เม็ด', 'อัน'
];

const THAI_NUMBER_WORDS = [
  'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า',
  'สิบ', 'ยี่สิบ', 'เอ็ด', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน', 'ครึ่ง'
];

const THAI_NUM_REGEX_PART = `(?:\\d[\\d,]*|(?:${THAI_NUMBER_WORDS.join('|')})+)`;

/**
 * Deterministic local AI accounting sentence parser
 * @param {string} input Spoken or typed Thai narrative sentence
 * @returns {object} Parsed items, arithmetic breakdown, starting cash, and remaining balance
 */
export function parseAccountingSentence(input) {
  if (!input || typeof input !== 'string') return null;

  let text = input.trim();
  const THAI_NUMERALS = { '๐': 0, '๑': 1, '๒': 2, '๓': 3, '๔': 4, '๕': 5, '๖': 6, '๗': 7, '๘': 8, '๙': 9 };
  text = text.replace(/[๐-๙]/g, ch => THAI_NUMERALS[ch]);

  // 1. Detect Starting Balance Context (เงินเดิม / เงินที่มีอยู่แล้ว)
  let startingBalance = null;
  const startingPattern = new RegExp(
    `(?:และ)?(?:เงินที่(?:ตัวเอง)?มีอยู่แล้ว|(?:เดิม|ตอนแรก|ก่อนหน้านี้)?(?:มีเงิน|เงินเดิมมี|มีเงินอยู่|มีเงินติดตัว(?:อยู่)?|มีเงินในกระเป๋า)|มีเงินอยู่แล้ว|เงินเดิมมี(?:อยู่)?)\\s*(${THAI_NUM_REGEX_PART})\\s*(?:บาท|฿)?`,
    'i'
  );

  const startMatch = text.match(startingPattern);
  if (startMatch) {
    const val = parseThaiNumberWords(startMatch[1]);
    if (val > 0) {
      startingBalance = val;
      text = text.replace(startMatch[0], ' ');
    }
  }

  // 2. Detect Balance Query / Question
  let hasQuestion = false;
  const questionPattern = /(?:ตอนนี้|สรุป|แล้ว)?\s*เหลือ(?:เงิน)?(?:เท่าไหร่|กี่บาท)?|(?:รวมแล้ว|รวมเป็น)?(?:เงิน)?(?:เท่าไหร่|กี่บาท)/i;
  if (questionPattern.test(text)) {
    hasQuestion = true;
    text = text.replace(questionPattern, ' ');
  }

  // 3. Segment into Clauses
  let clean = text
    // Connectors following an amount (e.g. "300 บาท แล้วก็", "10 บาท กับ", "50 บาท ก็")
    .replace(/(?<=(?:บาท|฿|[0-9]+)\s*)\s*(?:แล้วก็|และก็|แล้ว|จากนั้น|กับ|และ|ก็|แถม|โดย)\s*/g, ' ||| ')
    // Explicit transition words starting new action
    .replace(/\s*(?:แล้วก็|และก็|จากนั้น)\s*/g, ' ||| ')
    // Action verb boundary when preceded by amount without explicit connector
    .replace(/(?<=(?:บาท|฿|[0-9]+)\s*)\s*(?=(?:ซื้อ|จ่าย|กิน|ดื่ม|สั่ง|ได้เงิน|รับเงิน|ขาย))/g, ' ||| ')
    .replace(/[,;\n]+/g, ' ||| ');

  const rawClauses = clean.split('|||')
    .map(c => c.trim())
    .filter(c => c.length > 0);

  const items = [];

  for (let idx = 0; idx < rawClauses.length; idx++) {
    const clause = rawClauses[idx];
    if (!clause) continue;

    // Check multiplication: e.g. "20 ชิ้น ชิ้นละ 10 บาท", "10 ไม้ ไม้ละ 10 บาท", "2 แก้วแก้วละ 10"
    const multiPattern = new RegExp(
      `(${THAI_NUM_REGEX_PART})\\s*(${CLASSIFIERS.join('|')})\\s*(?:(?:${CLASSIFIERS.join('|')})?\\s*ละ)\\s*(${THAI_NUM_REGEX_PART})\\s*(?:บาท|฿|กว่า)?`,
      'i'
    );

    const multiMatch = clause.match(multiPattern);
    if (multiMatch) {
      const qty = parseThaiNumberWords(multiMatch[1]);
      const unit = multiMatch[2];
      const unitPrice = parseThaiNumberWords(multiMatch[3]);
      const totalAmount = qty * unitPrice;

      // Extract item name
      let itemName = clause
        .replace(multiMatch[0], '')
        .replace(/^(วันนี้ไป|วันนี้|ไป|มา|อีก|แล้วก็|แถม|และ|กับ|ก็)\s*/g, '')
        .replace(/\s*(บาท|฿|มา|อีก|กว่า|ครับ|ค่ะ|ไปอีก|ไป)\s*$/g, '')
        .trim();

      if (!itemName) {
        itemName = `${unit}`;
      }

      // Determine category & type
      let type = 'expense';
      if (/ขาย|รับจ้าง/.test(clause)) {
        type = 'income';
      }

      let categoryId = 'food';
      let categoryName = 'กับข้าว / ของกิน';
      let categoryIcon = '🍲';

      if (/ยา|หมอ/.test(clause)) {
        categoryId = 'medicine';
        categoryName = 'ค่ายา / หาหมอ';
        categoryIcon = '💊';
      } else if (/ผลไม้|ผัก|สวน|ต้นไม้|กล้วย|ส้ม/.test(clause)) {
        categoryId = 'food';
        categoryName = 'กับข้าว / ของกิน';
        categoryIcon = '🍲';
      } else if (/ผ้า|เสื้อ|กางเกง/.test(clause)) {
        categoryId = 'clothes';
        categoryName = 'เสื้อผ้า / ของสวยงาม';
        categoryIcon = '👕';
      } else if (/ซ่อม|บ้าน|ปุ๋ย/.test(clause)) {
        categoryId = 'home';
        categoryName = 'ซ่อมแซม / ของแต่งบ้าน';
        categoryIcon = '🏠';
      }

      items.push({
        id: `ai-item-${Date.now()}-${idx}`,
        type,
        amount: totalAmount,
        quantity: qty,
        unit,
        unitPrice,
        formulaText: `${qty} ${unit} × ฿${unitPrice} = ฿${totalAmount}`,
        note: `${itemName} ${qty} ${unit} (${unit}ละ ฿${unitPrice})`,
        categoryId,
        categoryName,
        categoryIcon,
        selected: true
      });
      continue;
    }

    // Single amount clause
    const amount = parseThaiNumberWords(clause);
    if (amount > 0) {
      const isIncome = /(?:ได้เงิน|รับเงิน|ได้ค่า|ค่าจ้าง|เงินเดือน|บำนาญ|เบี้ย|ขาย|โอนมา|ให้เงิน)/.test(clause) 
        && !/โอนให้|จ่าย|ซื้อ/.test(clause);

      const type = isIncome ? 'income' : 'expense';

      let categoryId = 'food';
      let categoryName = 'กับข้าว / ของกิน';
      let categoryIcon = '🍲';

      if (isIncome) {
        if (/ทำงาน|งาน|ค่าจ้าง|ค้าขาย|เงินเดือน|รับจ้าง/.test(clause)) {
          categoryId = 'work';
          categoryName = 'ค้าขาย / ทำงาน / ค่าจ้าง';
          categoryIcon = '💰';
        } else if (/คุณพ่อ|คุณแม่|พ่อ|แม่|ลูก|หลาน|ครอบครัว/.test(clause)) {
          categoryId = 'family_income';
          categoryName = 'ลูกหลานให้เงิน';
          categoryIcon = '👨‍👩‍👦';
        } else if (/เบี้ย|บำนาญ|คนแก่|คนชรา/.test(clause)) {
          categoryId = 'pension';
          categoryName = 'เบี้ยคนแก่ / บำนาญ';
          categoryIcon = '👴';
        } else {
          categoryId = 'other_income';
          categoryName = 'เงินเข้าอื่นๆ';
          categoryIcon = '✨';
        }
      } else {
        if (/ยา|หมอ|คลินิก|โรงพยาบาล/.test(clause)) {
          categoryId = 'medicine';
          categoryName = 'ค่ายา / หาหมอ';
          categoryIcon = '💊';
        } else if (/ไฟ|น้ำประปา|เน็ต|โทรศัพท์|บิล/.test(clause)) {
          categoryId = 'bills';
          categoryName = 'ค่าน้ำ / ค่าไฟ / เน็ต';
          categoryIcon = '💡';
        } else if (/รถ|น้ำมัน|แท็กซี่|เดินทาง/.test(clause)) {
          categoryId = 'travel';
          categoryName = 'ค่ารถ / เดินทาง';
          categoryIcon = '🚗';
        } else if (/บุญ|พระ|วัด|บาตร/.test(clause)) {
          categoryId = 'merit';
          categoryName = 'ทำบุญ / ช่วยงาน';
          categoryIcon = '🙏';
        } else if (/ของใช้|สบู่|ผงซักฟอก|ยาสระผม/.test(clause)) {
          categoryId = 'groceries';
          categoryName = 'ไปตลาด / ของใช้';
          categoryIcon = '🛒';
        } else {
          categoryId = 'food';
          categoryName = 'กับข้าว / ของกิน';
          categoryIcon = '🍲';
        }
      }

      // Clean note
      let cleanNote = clause
        .replace(new RegExp(String(amount), 'g'), '')
        .replace(/^(วันนี้ไป|วันนี้|ไป|มา|อีก|แล้วก็|แถม|และ|กับ|โดย|ทั้งหมด|ก็)\s*/g, '')
        .replace(/\s*(บาท|฿|ทั้งหมด|ไปอีก|ไป|มา|อีก|กว่า|ครับ|ค่ะ)\s*$/g, '')
        .trim();

      if (!cleanNote || cleanNote.length < 2) {
        cleanNote = isIncome ? 'ได้เงินมา' : 'จ่ายเงิน';
      }

      items.push({
        id: `ai-item-${Date.now()}-${idx}`,
        type,
        amount,
        quantity: null,
        unit: null,
        unitPrice: null,
        formulaText: `฿${amount}`,
        note: cleanNote,
        categoryId,
        categoryName,
        categoryIcon,
        selected: true
      });
    }
  }

  // 4. Summaries & Math
  const totalIncome = items.filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = items.filter(i => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0);
  const netChange = totalIncome - totalExpense;
  const remainingBalance = startingBalance !== null
    ? (startingBalance + netChange)
    : netChange;

  let speechAnswer = '';
  if (startingBalance !== null) {
    speechAnswer = `คำนวณให้แล้วครับ เงินเดิม ฿${startingBalance.toLocaleString()} รวมรายรับ ฿${totalIncome.toLocaleString()} หักรายจ่าย ฿${totalExpense.toLocaleString()} ตอนนี้เหลือเงินทั้งหมด ฿${remainingBalance.toLocaleString()} บาทครับ พบ ${items.length} รายการพร้อมบันทึกครับ`;
  } else {
    speechAnswer = `คำนวณให้แล้วครับ รวมรายรับ ฿${totalIncome.toLocaleString()} บาท รายจ่าย ฿${totalExpense.toLocaleString()} บาท สุทธิคงเหลือ ฿${remainingBalance.toLocaleString()} บาทครับ พบ ${items.length} รายการพร้อมบันทึกครับ`;
  }

  return {
    rawText: input,
    startingBalance,
    hasQuestion,
    items,
    totalIncome,
    totalExpense,
    netChange,
    remainingBalance,
    speechAnswer
  };
}

/**
 * Optional Gemini AI processing if API key is provided
 */
export async function parseAccountingWithGemini(input, apiKey) {
  if (!apiKey || !input) {
    return parseAccountingSentence(input);
  }

  try {
    const prompt = `คุณเป็น AI ผู้ช่วยทำบัญชีภาษาไทย วิเคราะห์ประโยคคำพูดการเงินต่อไปนี้ แยกรายการบัญชี และคำนวณคณิตศาสตร์:
"${input}"

ตอบกลับเป็น JSON เท่านั้น โดยมีโครงสร้างดังนี้:
{
  "startingBalance": <ตัวเลขเงินเดิมถ้ามี หรือ null>,
  "hasQuestion": <true หรือ false ถ้าผู้ใช้ถามว่าเหลือเงินเท่าไหร่>,
  "items": [
    {
      "type": "expense" หรือ "income",
      "amount": <จำนวนเงินรวมของรายการนี้เป็นตัวเลข เช่น 200>,
      "formulaText": "<สูตรคำนวณ เช่น 20 ชิ้น × ฿10 = ฿200>",
      "note": "<บันทึกข้อความ เช่น ซื้อไก่ 20 ชิ้น>",
      "categoryId": "<food|medicine|bills|travel|family|groceries|family_income|pension|work|other_income>",
      "categoryName": "<ชื่อหมวดภาษาไทย>",
      "categoryIcon": "<อีโมจิหมวด เช่น 🍲, 💊, 💡, 🚗, 👨‍👩‍👦>"
    }
  ]
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonText) throw new Error('Empty Gemini response');

    const parsed = JSON.parse(jsonText);
    const items = (parsed.items || []).map((item, idx) => ({
      id: `gemini-item-${Date.now()}-${idx}`,
      type: item.type === 'income' ? 'income' : 'expense',
      amount: Number(item.amount) || 0,
      formulaText: item.formulaText || `฿${item.amount}`,
      note: item.note || 'รายการบัญชี',
      categoryId: item.categoryId || (item.type === 'income' ? 'other_income' : 'food'),
      categoryName: item.categoryName || 'ทั่วไป',
      categoryIcon: item.categoryIcon || (item.type === 'income' ? '✨' : '🍲'),
      selected: true
    }));

    const totalIncome = items.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0);
    const totalExpense = items.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0);
    const netChange = totalIncome - totalExpense;
    const startingBalance = parsed.startingBalance !== null && parsed.startingBalance !== undefined 
      ? Number(parsed.startingBalance) 
      : null;
    const remainingBalance = startingBalance !== null ? startingBalance + netChange : netChange;

    let speechAnswer = '';
    if (startingBalance !== null) {
      speechAnswer = `คำนวณให้แล้วครับ เงินเดิม ฿${startingBalance.toLocaleString()} รวมรายรับ ฿${totalIncome.toLocaleString()} หักรายจ่าย ฿${totalExpense.toLocaleString()} ตอนนี้เหลือเงินทั้งหมด ฿${remainingBalance.toLocaleString()} บาทครับ พบ ${items.length} รายการพร้อมบันทึกครับ`;
    } else {
      speechAnswer = `คำนวณให้แล้วครับ รวมรายรับ ฿${totalIncome.toLocaleString()} บาท รายจ่าย ฿${totalExpense.toLocaleString()} บาท สุทธิคงเหลือ ฿${remainingBalance.toLocaleString()} บาทครับ พบ ${items.length} รายการพร้อมบันทึกครับ`;
    }

    return {
      rawText: input,
      startingBalance,
      hasQuestion: !!parsed.hasQuestion,
      items,
      totalIncome,
      totalExpense,
      netChange,
      remainingBalance,
      speechAnswer
    };
  } catch (err) {
    console.warn('[AI Accounting] Gemini fallback to local parser:', err);
    return parseAccountingSentence(input);
  }
}
