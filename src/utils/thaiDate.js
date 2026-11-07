// Thai Date formatting utilities

const THAI_DAYS = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString() {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatThaiDateFull(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = THAI_DAYS[dateObj.getDay()];
  const thaiYear = y + 543;
  const monthName = THAI_MONTHS_FULL[m - 1];
  return `${dayOfWeek}ที่ ${d} ${monthName} ${thaiYear}`;
}

export function formatThaiDateHeader(dateStr) {
  if (!dateStr) return '';
  const today = getTodayString();
  
  const dObj = new Date();
  dObj.setDate(dObj.getDate() - 1);
  const yesterdayYear = dObj.getFullYear();
  const yesterdayMonth = String(dObj.getMonth() + 1).padStart(2, '0');
  const yesterdayDay = String(dObj.getDate()).padStart(2, '0');
  const yesterday = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

  const [y, m, d] = dateStr.split('-').map(Number);
  const thaiYear = y + 543;
  const monthShort = THAI_MONTHS_SHORT[m - 1];

  if (dateStr === today) {
    return `วันนี้ (${d} ${monthShort} ${thaiYear})`;
  } else if (dateStr === yesterday) {
    return `เมื่อวาน (${d} ${monthShort} ${thaiYear})`;
  } else {
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = THAI_DAYS[dateObj.getDay()];
    return `${dayOfWeek}ที่ ${d} ${monthShort} ${thaiYear}`;
  }
}

export function formatThaiMonth(yearMonthStr) {
  // yearMonthStr: 'YYYY-MM'
  if (!yearMonthStr) return '';
  const [y, m] = yearMonthStr.split('-').map(Number);
  return `${THAI_MONTHS_FULL[m - 1]} ${y + 543}`;
}

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return num.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatBaht(amount, prefix = '') {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absFormatted = Math.abs(num).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  if (isNegative) return `-฿${absFormatted}`;
  if (prefix) return `${prefix}฿${absFormatted}`;
  return `฿${absFormatted}`;
}
