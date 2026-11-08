import { supabase } from './supabase';

export const DEFAULT_ADMIN_EMAIL = 'tharanut@gmail.com';

/**
 * Get current configured admin email
 */
export function getAdminEmail() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('banchee_admin_email');
    if (saved && saved.trim()) return saved.trim();
  }
  return DEFAULT_ADMIN_EMAIL;
}

/**
 * Set custom admin email
 */
export function setAdminEmail(email) {
  if (typeof localStorage !== 'undefined' && email && email.trim()) {
    localStorage.setItem('banchee_admin_email', email.trim());
  }
}

/**
 * Send 6-digit OTP code to the admin's email via Supabase Auth
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function sendAdminEmailOtp(email = getAdminEmail()) {
  try {
    const targetEmail = (email || DEFAULT_ADMIN_EMAIL).trim();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bancheerub.vercel.app';
    const { data, error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: origin
      }
    });

    if (error) {
      console.warn('[Admin OTP] Supabase send error:', error);
      if (error.status === 429 || error.message?.includes('rate limit')) {
        throw new Error('ส่งอีเมลเกินโควต้าชั่วคราว กรุณาใช้รหัสผ่านแอดมิน (PIN) แทนเพื่อเข้าใช้งานได้ทันทีครับ');
      }
      throw new Error(error.message || 'ไม่สามารถส่งอีเมลได้');
    }

    return {
      success: true,
      message: `ส่งลิงก์ยืนยันเรียบร้อยแล้วไปยัง ${targetEmail}`,
      data
    };
  } catch (err) {
    console.error('[Admin OTP] Error:', err);
    throw err;
  }
}

/**
 * Verify 6-digit OTP code sent to admin's email
 * @param {string} token 6-digit code
 * @param {string} email admin email
 * @returns {Promise<{ success: boolean, user: object }>}
 */
export async function verifyAdminEmailOtp(token, email = getAdminEmail()) {
  try {
    const targetEmail = (email || DEFAULT_ADMIN_EMAIL).trim();
    const cleanToken = String(token || '').trim();

    if (!cleanToken) {
      throw new Error('กรุณากรอกรหัส OTP 6 ตัวให้ครบ');
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: targetEmail,
      token: cleanToken,
      type: 'email'
    });

    if (error) {
      console.warn('[Admin OTP] Verify error:', error);
      throw new Error('รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้วครับ กรุณาลองใหม่อีกครั้ง');
    }

    return {
      success: true,
      user: data?.user || null
    };
  } catch (err) {
    console.error('[Admin OTP] Verification failed:', err);
    throw err;
  }
}
