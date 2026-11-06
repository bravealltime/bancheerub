// Default recurring bills and pension reminders for Thai seniors

export const DEFAULT_REMINDERS = [
  {
    id: 'rem-pension',
    title: 'เบี้ยยังชีพผู้สูงอายุเข้าบัญชี',
    type: 'income',
    dayOfMonth: 10,
    amount: 800,
    icon: '👴',
    note: 'เงินเข้าบัญชีธนาคารทุกวันที่ 10'
  },
  {
    id: 'rem-electric',
    title: 'ค่าไฟบ้าน',
    type: 'expense',
    dayOfMonth: 18,
    amount: 450,
    icon: '💡',
    note: 'การไฟฟ้านครหลวง/ส่วนภูมิภาค'
  },
  {
    id: 'rem-water',
    title: 'ค่าน้ำประปา',
    type: 'expense',
    dayOfMonth: 20,
    amount: 120,
    icon: '💧',
    note: 'การประปา'
  },
  {
    id: 'rem-phone',
    title: 'ค่าโทรศัพท์ / เน็ตมือถือ',
    type: 'expense',
    dayOfMonth: 25,
    amount: 200,
    icon: '📱',
    note: 'เติมเงินหรือจ่ายรายเดือน'
  }
];
