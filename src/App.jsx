import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProfilePickerScreen from './components/ProfilePickerScreen';
import SummaryCard from './components/SummaryCard';
import MainActionButtons from './components/MainActionButtons';
import TransactionList from './components/TransactionList';
import RecordModal from './components/RecordModal';
import MonthlyReportModal from './components/MonthlyReportModal';
import SettingsModal from './components/SettingsModal';
import RemindersModal from './components/RemindersModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import PrintReportView from './components/PrintReportView';
import InstallPromptBanner from './components/InstallPromptBanner';
import PinEntryModal from './components/PinEntryModal';
import ShareSummaryModal from './components/ShareSummaryModal';
import { getInitialTransactions } from './data/initialData';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './data/defaultCategories';
import { DEFAULT_REMINDERS } from './data/defaultReminders';
import { DEFAULT_BOOKS, DEFAULT_ADMIN_PIN } from './data/defaultBooks';
import { getTodayString } from './utils/thaiDate';
import { Phone } from 'lucide-react';

export default function App() {
  // 1. Persistent State
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('banchee_transactions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse transactions', e);
    }
    return getInitialTransactions();
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('banchee_font_size') || 'normal';
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('banchee_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [emergencyPhone, setEmergencyPhone] = useState(() => {
    return localStorage.getItem('banchee_emergency_phone') || '';
  });

  // Family Member Books State with automatic migration for default PINs
  const [books, setBooks] = useState(() => {
    try {
      const saved = localStorage.getItem('banchee_family_books');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(b => {
            const defaultMatch = DEFAULT_BOOKS.find(db => db.id === b.id);
            return {
              ...b,
              pin: b.pin || defaultMatch?.pin || (
                b.id === 'book-grandpa' ? '1111' :
                b.id === 'book-grandma' ? '2222' :
                b.id === 'book-home' ? '0000' :
                b.id === 'book-child' ? '3333' : '1111'
              )
            };
          });
        }
      }
    } catch {}
    return DEFAULT_BOOKS;
  });

  // Active book ID (null means show Profile Picker Screen)
  const [activeBookId, setActiveBookId] = useState(() => {
    return localStorage.getItem('banchee_active_book_id') || null;
  });

  // Admin Master PIN State (default '9999' unlocks any book)
  const [adminPin, setAdminPin] = useState(() => {
    return localStorage.getItem('banchee_admin_pin') || DEFAULT_ADMIN_PIN;
  });

  // Target book pending PIN entry
  const [pinModalBook, setPinModalBook] = useState(null);

  // LINE Share Modal Data
  const [shareModalData, setShareModalData] = useState(null);

  // Custom Categories
  const [expenseCategories, setExpenseCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('banchee_expense_categories');
      if (saved) return JSON.parse(saved);
    } catch {}
    return EXPENSE_CATEGORIES;
  });

  const [incomeCategories, setIncomeCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('banchee_income_categories');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INCOME_CATEGORIES;
  });

  // Reminders
  const [reminders, setReminders] = useState(() => {
    try {
      const saved = localStorage.getItem('banchee_reminders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_REMINDERS;
  });

  const [completedReminders, setCompletedReminders] = useState(() => {
    try {
      const saved = localStorage.getItem('banchee_completed_reminders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // 2. Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordModalType, setRecordModalType] = useState('expense');
  const [editingItem, setEditingItem] = useState(null);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('banchee_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions', e);
    }
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('banchee_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('banchee_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('banchee_emergency_phone', emergencyPhone);
  }, [emergencyPhone]);

  useEffect(() => {
    localStorage.setItem('banchee_family_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    if (activeBookId) {
      localStorage.setItem('banchee_active_book_id', activeBookId);
    } else {
      localStorage.removeItem('banchee_active_book_id');
    }
  }, [activeBookId]);

  useEffect(() => {
    localStorage.setItem('banchee_admin_pin', adminPin);
  }, [adminPin]);

  useEffect(() => {
    localStorage.setItem('banchee_expense_categories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem('banchee_income_categories', JSON.stringify(incomeCategories));
  }, [incomeCategories]);

  useEffect(() => {
    localStorage.setItem('banchee_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('banchee_completed_reminders', JSON.stringify(completedReminders));
  }, [completedReminders]);

  // Current active book object
  const currentBook = books.find(b => b.id === activeBookId) || books[0];

  // Calculations for current book
  const todayStr = getTodayString();
  const currentMonthStr = todayStr.slice(0, 7);
  const currentDay = parseInt(todayStr.slice(8, 10), 10) || 1;

  // Transactions belonging to this book
  const bookTransactions = transactions.filter(t => (t.bookId || t.accountId || 'book-grandpa') === activeBookId);

  const totalIncomeAll = bookTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseAll = bookTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncomeAll - totalExpenseAll;

  // Today totals
  const todayTransactions = bookTransactions.filter(t => t.date === todayStr);
  const todayIncome = todayTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpense = todayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Current month totals
  const monthTransactions = bookTransactions.filter(t => t.date.startsWith(currentMonthStr));
  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Pending reminders count
  const pendingRemindersCount = reminders.filter(r => {
    const key = `${currentMonthStr}-${r.id}`;
    if (completedReminders[key]) return false;
    const diff = r.dayOfMonth - currentDay;
    return diff <= 5;
  }).length;

  // Next upcoming reminder banner
  const upcomingReminder = reminders
    .filter(r => {
      const key = `${currentMonthStr}-${r.id}`;
      return !completedReminders[key] && r.dayOfMonth >= currentDay;
    })
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth)[0];

  // Handlers
  const handleOpenExpense = () => {
    setEditingItem(null);
    setRecordModalType('expense');
    setIsRecordModalOpen(true);
  };

  const handleOpenIncome = () => {
    setEditingItem(null);
    setRecordModalType('income');
    setIsRecordModalOpen(true);
  };

  const handleEditTransaction = (item) => {
    setEditingItem(item);
    setRecordModalType(item.type);
    setIsRecordModalOpen(true);
  };

  const handleDeleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveTransaction = (item) => {
    if (editingItem) {
      setTransactions(prev => prev.map(t => t.id === item.id ? item : t));
    } else {
      setTransactions(prev => [item, ...prev]);
    }
  };

  const handleRestoreTransactions = (newItems) => {
    setTransactions(newItems);
  };

  const handleResetData = () => {
    setTransactions([]);
  };

  const handleToggleCompleteReminder = (key) => {
    setCompletedReminders(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddBook = (newBook) => {
    setBooks(prev => [...prev, newBook]);
  };

  const handleDeleteBook = (bookId) => {
    if (books.length <= 1) return;
    setBooks(prev => prev.filter(b => b.id !== bookId));
    if (activeBookId === bookId) {
      setActiveBookId(null);
    }
  };

  const fontScaleClass = 
    fontSize === 'huge' ? 'font-scale-huge' :
    fontSize === 'large' ? 'font-scale-large' : 'font-scale-normal';

  // IF NO ACTIVE BOOK SELECTED -> SHOW PROFILE PICKER SCREEN FIRST!
  if (!activeBookId) {
    return (
      <div className={`min-h-screen w-full bg-[#F6F4EF] ${fontScaleClass}`}>
        <ProfilePickerScreen
          books={books}
          onSelectBookWithPin={(book) => setPinModalBook(book)}
          onAddBook={handleAddBook}
          onDeleteBook={handleDeleteBook}
          transactions={transactions}
        />

        {/* 4-digit PIN Modal */}
        <PinEntryModal
          isOpen={!!pinModalBook}
          book={pinModalBook}
          adminPin={adminPin}
          onClose={() => setPinModalBook(null)}
          onSuccess={(bookId) => {
            setActiveBookId(bookId);
            setPinModalBook(null);
          }}
        />
      </div>
    );
  }

  // ONCE A BOOK IS SELECTED -> SHOW THAT PERSON'S CLEAN LEDGER!
  return (
    <div className={`min-h-screen w-full bg-[#F6F4EF] text-[#2D2A26] flex flex-col overflow-x-hidden ${fontScaleClass}`}>
      {/* Top Header with Switch Button */}
      <Header
        currentBook={currentBook}
        onSwitchBook={() => setActiveBookId(null)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMonthlyReport={() => setIsMonthlyReportOpen(true)}
        onOpenReminders={() => setIsRemindersOpen(true)}
        pendingRemindersCount={pendingRemindersCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-3 sm:px-4 py-3 pb-24 overflow-x-hidden no-print">
        {/* Optional Add-to-Home Screen prompt */}
        <InstallPromptBanner />

        {/* Upcoming Bill / Pension Alert Pill */}
        {upcomingReminder && (
          <div className="bg-[#FAF9F5] border border-stone-300 rounded-xl px-3 py-2 mb-3 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">{upcomingReminder.icon}</span>
              <div className="text-xs text-stone-700 truncate">
                <span className="font-bold text-stone-900">{upcomingReminder.title}</span>
                <span className="text-stone-500 ml-1">
                  (ทุกวันที่ {upcomingReminder.dayOfMonth})
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsRemindersOpen(true)}
              className="text-[11px] font-bold text-stone-800 underline flex-shrink-0 cursor-pointer"
            >
              ดูรายการเตือน
            </button>
          </div>
        )}

        {/* Big Balance & Period Summary Card */}
        <SummaryCard
          totalBalance={totalBalance}
          todayIncome={todayIncome}
          todayExpense={todayExpense}
          monthIncome={monthIncome}
          monthExpense={monthExpense}
          soundEnabled={soundEnabled}
          todayTransactions={todayTransactions}
          onOpenShare={setShareModalData}
        />

        {/* 2 Big Action Buttons: Expense & Income */}
        <MainActionButtons
          onOpenExpense={handleOpenExpense}
          onOpenIncome={handleOpenIncome}
        />

        {/* Transaction History List */}
        <TransactionList
          transactions={bookTransactions}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          soundEnabled={soundEnabled}
        />
      </main>

      {/* Bottom Emergency Phone Bar */}
      {emergencyPhone && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 sm:px-4 py-2 no-print">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-stone-600 truncate flex-1 min-w-0">
              ติดต่อ: {emergencyPhone}
            </span>
            <a
              href={`tel:${emergencyPhone}`}
              className="btn-tactile px-3 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#24563F] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 flex-shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>โทรออก</span>
            </a>
          </div>
        </div>
      )}

      {/* Modals */}
      <RecordModal
        isOpen={isRecordModalOpen}
        initialType={recordModalType}
        editingItem={editingItem}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleSaveTransaction}
        soundEnabled={soundEnabled}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        currentBook={currentBook}
      />

      <MonthlyReportModal
        isOpen={isMonthlyReportOpen}
        onClose={() => setIsMonthlyReportOpen(false)}
        transactions={bookTransactions}
        soundEnabled={soundEnabled}
        totalBalance={totalBalance}
        onOpenShare={setShareModalData}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userName={currentBook?.name || 'คุณตา'}
        onSaveUserName={(name) => {
          setBooks(prev => prev.map(b => b.id === activeBookId ? { ...b, name } : b));
        }}
        currentBook={currentBook}
        onUpdateBookPin={(newPin) => {
          setBooks(prev => prev.map(b => b.id === activeBookId ? { ...b, pin: newPin } : b));
        }}
        adminPin={adminPin}
        onUpdateAdminPin={(newPin) => setAdminPin(newPin)}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        emergencyPhone={emergencyPhone}
        onSaveEmergencyPhone={setEmergencyPhone}
        transactions={transactions}
        onRestoreTransactions={handleRestoreTransactions}
        onResetData={handleResetData}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        onSwitchBook={() => setActiveBookId(null)}
      />

      <RemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        reminders={reminders}
        onSaveReminders={setReminders}
        completedReminders={completedReminders}
        onToggleCompleteReminder={handleToggleCompleteReminder}
      />

      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        onSaveExpenseCategories={setExpenseCategories}
        onSaveIncomeCategories={setIncomeCategories}
      />

      {/* LINE Share Modal */}
      <ShareSummaryModal
        isOpen={!!shareModalData}
        onClose={() => setShareModalData(null)}
        shareData={shareModalData}
      />

      {/* A4 Printable Report View (Visible only during window.print()) */}
      <PrintReportView
        selectedMonth={currentMonthStr}
        userName={currentBook?.name || 'คุณตาคุณยาย'}
        transactions={bookTransactions}
      />
    </div>
  );
}
