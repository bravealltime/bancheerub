// Realistic sample initial transactions for first-time onboarding
import { getTodayString } from '../utils/thaiDate';

export function getInitialTransactions() {
  const today = getTodayString();
  
  // Calculate yesterday
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yYear = d.getFullYear();
  const yMonth = String(d.getMonth() + 1).padStart(2, '0');
  const yDay = String(d.getDate()).padStart(2, '0');
  const yesterday = `${yYear}-${yMonth}-${yDay}`;

  return [
    {
      id: 'init-1',
      type: 'income',
      amount: 1500,
      category: 'ลูกหลานให้เงิน',
      categoryIcon: '👨‍👩‍👦',
      categoryId: 'family_income',
      note: 'ลูกสาวโอนให้เป็นค่าใช้จ่าย',
      date: today,
      time: '08:30',
      timestamp: Date.now() - 3600000 * 3
    },
    {
      id: 'init-2',
      type: 'expense',
      amount: 80,
      category: 'กับข้าว / ของกิน',
      categoryIcon: '🍲',
      categoryId: 'food',
      note: 'ซื้อข้าวมันไก่และกาแฟโบราณ',
      date: today,
      time: '09:15',
      timestamp: Date.now() - 3600000 * 2
    },
    {
      id: 'init-3',
      type: 'expense',
      amount: 120,
      category: 'ค่ายา / หาหมอ',
      categoryIcon: '💊',
      categoryId: 'medicine',
      note: 'ซื้อยาพาราและยานวดคลายเส้น',
      date: yesterday,
      time: '14:20',
      timestamp: Date.now() - 86400000
    },
    {
      id: 'init-4',
      type: 'income',
      amount: 800,
      category: 'เบี้ยคนแก่ / บำนาญ',
      categoryIcon: '👴',
      categoryId: 'pension',
      note: 'เบี้ยยังชีพผู้สูงอายุเข้าบัญชี',
      date: yesterday,
      time: '10:00',
      timestamp: Date.now() - 86400000 - 3600000
    }
  ];
}
