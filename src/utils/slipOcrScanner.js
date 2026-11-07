// Smart Thai Bank Slip & Receipt OCR Scanner
// Extracts amount, transaction date, time, and transfer direction from bank slips
import { createWorker } from 'tesseract.js';

const THAI_MONTH_MAP = {
  'ม.ค.': 1, 'มกราคม': 1,
  'ก.พ.': 2, 'กุมภาพันธ์': 2,
  'มี.ค.': 3, 'มีนาคม': 3,
  'เม.ย.': 4, 'เมษายน': 4,
  'พ.ค.': 5, 'พฤษภาคม': 5,
  'มิ.ย.': 6, 'มิถุนายน': 6,
  'ก.ค.': 7, 'กรกฎาคม': 7,
  'ส.ค.': 8, 'สิงหาคม': 8,
  'ก.ย.': 9, 'กันยายน': 9,
  'ต.ค.': 10, 'ตุลาคม': 10,
  'พ.ย.': 11, 'พฤศจิกายน': 11,
  'ธ.ค.': 12, 'ธันวาคม': 12,
};

let cachedWorker = null;

async function getWorker() {
  if (cachedWorker) return cachedWorker;
  try {
    const worker = await createWorker('eng+tha');
    cachedWorker = worker;
    return worker;
  } catch (err) {
    console.warn('Fallback to eng-only OCR worker:', err);
    const worker = await createWorker('eng');
    cachedWorker = worker;
    return worker;
  }
}

export async function scanSlipOrReceipt(imageSource) {
  try {
    const worker = await getWorker();

    const ret = await worker.recognize(imageSource);
    const text = ret.data.text || '';
    const confidence = ret.data.confidence || 0;

    // 1. Extract Amount (look for decimal currency patterns e.g. 500.00, 1,250.00, 80.00)
    let detectedAmount = 0;

    // A. Explicit amount labels
    const explicitAmountMatch = text.match(
      /(?:จำนวนเงิน|ยอดเงิน|โอนเงิน|amount|total|thb|บาท|ยอดชำระ|ชำระ)\s*[:=]?\s*([0-9,]+\.[0-9]{2})/i
    );

    if (explicitAmountMatch) {
      detectedAmount = parseFloat(explicitAmountMatch[1].replace(/,/g, ''));
    } else {
      // B. Look for standard currency decimal pattern ending with .XX
      const allDecimalMatches = [...text.matchAll(/([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/g)];
      if (allDecimalMatches.length > 0) {
        // Pick the most plausible transaction amount (usually > 0 and <= 1,000,000)
        const candidates = allDecimalMatches
          .map(m => parseFloat(m[1].replace(/,/g, '')))
          .filter(n => n > 0 && n < 10000000);

        if (candidates.length > 0) {
          detectedAmount = candidates[0];
        }
      } else {
        // C. Look for integer baht amounts e.g. 500 บาท
        const intMatch = text.match(/([0-9,]+)\s*(?:บาท|thb)/i);
        if (intMatch) {
          detectedAmount = parseFloat(intMatch[1].replace(/,/g, ''));
        }
      }
    }

    // 2. Extract Time (HH:MM e.g. 14:35, 09:12)
    let detectedTime = '';
    const timeMatch = text.match(/([0-1]?[0-9]|2[0-3]):([0-5][0-9])/);
    if (timeMatch) {
      detectedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }

    // 3. Extract Date (Thai month abbreviations e.g. 7 พ.ย. 69 or 07/11/2026)
    let detectedDate = '';
    const thaiDateMatch = text.match(/(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{2,4})/);
    if (thaiDateMatch) {
      const day = thaiDateMatch[1].padStart(2, '0');
      const mStr = thaiDateMatch[2];
      const monthNum = String(THAI_MONTH_MAP[mStr] || 1).padStart(2, '0');
      let yearNum = parseInt(thaiDateMatch[3], 10);
      if (yearNum < 100) yearNum += 2500; // e.g. 69 -> 2569 BE
      const adYear = yearNum > 2400 ? yearNum - 543 : yearNum;
      detectedDate = `${adYear}-${monthNum}-${day}`;
    }

    // 4. Detect Bank or Platform Name
    let bankName = 'สลิปโอนเงิน';
    const lower = text.toLowerCase();
    if (lower.includes('k plus') || lower.includes('kasikorn')) bankName = 'ธ.กสิกรไทย (K PLUS)';
    else if (lower.includes('scb') || lower.includes('easy')) bankName = 'ธ.ไทยพาณิชย์ (SCB)';
    else if (lower.includes('krungthai') || lower.includes('next')) bankName = 'ธ.กรุงไทย (Krungthai NEXT)';
    else if (lower.includes('ttb')) bankName = 'ธ.ทหารไทยธนชาต (ttb)';
    else if (lower.includes('gsb') || lower.includes('mymo')) bankName = 'ธ.ออมสิน (MyMo)';
    else if (lower.includes('bangkok bank') || lower.includes('bualuang')) bankName = 'ธ.กรุงเทพ (Bualuang)';
    else if (lower.includes('truemoney') || lower.includes('true wallet')) bankName = 'TrueMoney Wallet';
    else if (lower.includes('promptpay') || lower.includes('พร้อมเพย์')) bankName = 'พร้อมเพย์ (PromptPay)';
    else if (lower.includes('7-eleven') || lower.includes('seven')) bankName = 'ใบเสร็จ 7-Eleven';

    // 5. Determine Transaction Direction (Income vs Expense)
    // Most user uploads of incoming money contain "รับเงิน" or "โอนเงินสำเร็จ" to my account
    let suggestedType = 'expense';
    if (
      lower.includes('รับเงิน') ||
      lower.includes('เงินเข้า') ||
      lower.includes('received') ||
      lower.includes('income') ||
      lower.includes('โอนเข้าบัญชี')
    ) {
      suggestedType = 'income';
    }

    return {
      success: detectedAmount > 0,
      amount: detectedAmount > 0 ? detectedAmount : 0,
      date: detectedDate,
      time: detectedTime,
      bankName,
      type: suggestedType,
      confidence: Math.round(confidence),
      rawText: text
    };
  } catch (err) {
    console.error('Slip OCR scanning failed:', err);
    return {
      success: false,
      amount: 0,
      date: '',
      time: '',
      bankName: 'สลิป',
      type: 'expense',
      confidence: 0,
      rawText: ''
    };
  }
}
