// Utility to share income/expense summary to LINE or family members
import { formatCurrency } from './thaiDate';

/**
 * Generate formatted Thai summary text for LINE or messaging apps
 */
export function generateSummaryText({
  title = 'สรุปยอดเงิน',
  periodText = '',
  totalBalance = 0,
  income = 0,
  expense = 0,
  transactions = []
}) {
  const net = income - expense;

  let text = `📒 สมุดเงินทอง (${title})\n`;
  if (periodText) {
    text += `📅 ประจำ: ${periodText}\n`;
  }
  text += `💰 เงินคงเหลือรวม: ฿${formatCurrency(totalBalance)} บาท\n`;
  text += `🟢 เงินเข้า: +฿${formatCurrency(income)} บาท\n`;
  text += `🔴 เงินออก: -฿${formatCurrency(expense)} บาท\n`;
  text += `✨ ยอดส่วนต่าง: ${net >= 0 ? '+' : '-'}฿${formatCurrency(Math.abs(net))} บาท\n`;

  if (transactions && transactions.length > 0) {
    text += `\n📝 รายการล่าสุด:\n`;
    transactions.slice(0, 5).forEach((tx) => {
      const sign = tx.type === 'expense' ? '-' : '+';
      text += `• ${tx.categoryIcon || ''} ${tx.category}: ${sign}฿${formatCurrency(tx.amount)} ${tx.note ? '(' + tx.note + ')' : ''}\n`;
    });
  }

  text += `\n(บันทึกจากแอปสมุดเงินทอง)`;
  return text;
}

/**
 * Copy text to clipboard with fallback for non-secure HTTP contexts
 */
export async function copyToClipboard(text) {
  // 1. Try modern clipboard API if supported and in secure context
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  // 2. Fallback using temporary textarea (works in HTTP / older devices)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.warn('Clipboard copy failed', err);
    return false;
  }
}

/**
 * Get the direct universal LINE sharing URL
 */
export function getLineShareUrl(text) {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}

/**
 * Direct share handler (tries native share, then direct link)
 */
export async function shareSummary({
  title,
  periodText,
  totalBalance,
  income,
  expense,
  transactions = []
}) {
  const text = generateSummaryText({
    title,
    periodText,
    totalBalance,
    income,
    expense,
    transactions
  });

  // Always copy to clipboard first as a fail-safe
  await copyToClipboard(text);

  // 1. Try native Web Share API (only works on HTTPS/localhost on supported browsers)
  if (navigator.share && window.isSecureContext) {
    try {
      await navigator.share({
        title: 'สรุปรายรับรายจ่าย - สมุดเงินทอง',
        text: text
      });
      return { success: true, method: 'native' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'aborted' };
      }
    }
  }

  // 2. Direct LINE Universal Link
  const lineUrl = getLineShareUrl(text);
  
  // If mobile, direct location assignment triggers LINE app intent without popup blocker
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = lineUrl;
  } else {
    window.open(lineUrl, '_blank', 'noopener,noreferrer');
  }

  return { success: true, method: 'line' };
}
