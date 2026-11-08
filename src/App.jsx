import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import OnboardingTutorialModal from './components/OnboardingTutorialModal';
import HouseManagerModal from './components/HouseManagerModal';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './data/defaultCategories';
import { DEFAULT_REMINDERS } from './data/defaultReminders';
import { DEFAULT_BOOKS, DEFAULT_ADMIN_PIN } from './data/defaultBooks';
import { getTodayString } from './utils/thaiDate';
import { Phone } from 'lucide-react';
import {
  fetchLedgerState,
  syncLedgerToCloud,
  saveTransactionToCloud,
  deleteTransactionFromCloud,
  saveBookToCloud,
  deleteBookFromCloud
} from './services/ledgerApi';
import { uploadReceiptPhotoToSupabase } from './services/supabase';
import {
  getInitialHouseId,
  getHouseName,
  setHouseName,
  saveHouseToList,
  DEFAULT_MAIN_HOUSE_ID,
  normalizeHouseCode
} from './utils/houseManager';

const getStorageKey = (baseKey, houseId) => {
  return houseId === DEFAULT_MAIN_HOUSE_ID ? baseKey : `${baseKey}_${houseId}`;
};

export default function App() {
  // House Multi-Tenancy State
  const initialHouse = getInitialHouseId();
  const [currentHouseId, setCurrentHouseId] = useState(initialHouse);
  const [currentHouseName, setCurrentHouseName] = useState(() => getHouseName(initialHouse));
  const [isHouseManagerOpen, setIsHouseManagerOpen] = useState(false);

  // 1. Persistent State (Free of mock data, isolated per house)
  const [transactions, setTransactions] = useState(() => {
    try {
      const key = getStorageKey('banchee_transactions', initialHouse);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any mock up data from earlier builds
          return parsed.filter(t => !String(t.id).startsWith('init-'));
        }
      }
    } catch (e) {
      console.error('Failed to parse transactions', e);
    }
    return [];
  });

  // Onboarding Tutorial State (shows on first entry)
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('banchee_tutorial_seen');
  });

  const handleCloseTutorial = () => {
    localStorage.setItem('banchee_tutorial_seen', 'true');
    setShowTutorial(false);
  };

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
      const key = getStorageKey('banchee_family_books', initialHouse);
      const saved = localStorage.getItem(key);
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
    const key = getStorageKey('banchee_active_book_id', initialHouse);
    return localStorage.getItem(key) || null;
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
      const key = getStorageKey('banchee_reminders', initialHouse);
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_REMINDERS;
  });

  const [completedReminders, setCompletedReminders] = useState(() => {
    try {
      const key = getStorageKey('banchee_completed_reminders', initialHouse);
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // 2. Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordModalType, setRecordModalType] = useState('expense');
  const [editingItem, setEditingItem] = useState(null);
  const [autoStartVoice, setAutoStartVoice] = useState(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Cloud Sync State (HomeSpace + Supabase)
  const [cloudStatus, setCloudStatus] = useState('syncing'); // 'synced' | 'syncing' | 'offline'
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Switch House Handler (Switch context, storage partition, and state)
  const handleSwitchHouse = useCallback((newHouseId, newHouseName) => {
    const cleanId = normalizeHouseCode(newHouseId);
    if (!cleanId) return;
    localStorage.setItem('banchee_active_house_id', cleanId);
    const nameToUse = newHouseName || getHouseName(cleanId);
    if (nameToUse) {
      setHouseName(cleanId, nameToUse);
      saveHouseToList(cleanId, nameToUse);
    }
    setCurrentHouseId(cleanId);
    setCurrentHouseName(nameToUse);

    // Load cached data for new house
    const txKey = getStorageKey('banchee_transactions', cleanId);
    const booksKey = getStorageKey('banchee_family_books', cleanId);
    const activeBookKey = getStorageKey('banchee_active_book_id', cleanId);
    const remindersKey = getStorageKey('banchee_reminders', cleanId);
    const completedRemindersKey = getStorageKey('banchee_completed_reminders', cleanId);

    try {
      const savedTx = localStorage.getItem(txKey);
      setTransactions(savedTx ? JSON.parse(savedTx) : []);
    } catch {
      setTransactions([]);
    }

    try {
      const savedBooks = localStorage.getItem(booksKey);
      setBooks(savedBooks ? JSON.parse(savedBooks) : DEFAULT_BOOKS);
    } catch {
      setBooks(DEFAULT_BOOKS);
    }

    const savedActiveBook = localStorage.getItem(activeBookKey);
    setActiveBookId(savedActiveBook || null);

    try {
      const savedReminders = localStorage.getItem(remindersKey);
      setReminders(savedReminders ? JSON.parse(savedReminders) : DEFAULT_REMINDERS);
    } catch {
      setReminders(DEFAULT_REMINDERS);
    }

    try {
      const savedCompleted = localStorage.getItem(completedRemindersKey);
      setCompletedReminders(savedCompleted ? JSON.parse(savedCompleted) : {});
    } catch {
      setCompletedReminders({});
    }

    setIsHouseManagerOpen(false);
    setCloudStatus('syncing');
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey('banchee_transactions', currentHouseId), JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions', e);
    }
  }, [transactions, currentHouseId]);

  useEffect(() => {
    localStorage.setItem('banchee_font_size', fontSize);
    const scale = fontSize === 'huge' ? 1.36 : fontSize === 'large' ? 1.18 : 1.0;
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${16 * scale}px`;
      document.documentElement.setAttribute('data-font-size', fontSize);
      document.documentElement.style.setProperty('--app-font-scale', String(scale));
    }
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('banchee_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('banchee_emergency_phone', emergencyPhone);
  }, [emergencyPhone]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('banchee_family_books', currentHouseId), JSON.stringify(books));
  }, [books, currentHouseId]);

  useEffect(() => {
    const key = getStorageKey('banchee_active_book_id', currentHouseId);
    if (activeBookId) {
      localStorage.setItem(key, activeBookId);
    } else {
      localStorage.removeItem(key);
    }
  }, [activeBookId, currentHouseId]);

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
    localStorage.setItem(getStorageKey('banchee_reminders', currentHouseId), JSON.stringify(reminders));
  }, [reminders, currentHouseId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('banchee_completed_reminders', currentHouseId), JSON.stringify(completedReminders));
  }, [completedReminders, currentHouseId]);

  const transactionsRef = useRef(transactions);
  const booksRef = useRef(books);
  const remindersRef = useRef(reminders);

  useEffect(() => {
    transactionsRef.current = transactions;
    booksRef.current = books;
    remindersRef.current = reminders;
  });

  // Background Cloud Sync & Auto-merge
  const pullCloudState = useCallback(async () => {
    try {
      const data = await fetchLedgerState(currentHouseId);
      if (data && data.success) {
        // 1. Transactions merge
        if (Array.isArray(data.transactions) && data.transactions.length > 0) {
          setTransactions(prev => {
            const map = new Map();
            data.transactions.forEach(t => map.set(t.id, t));
            prev.forEach(t => {
              if (!map.has(t.id)) {
                map.set(t.id, t);
                saveTransactionToCloud(t, currentHouseId).catch(() => {});
              }
            });
            return Array.from(map.values()).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));
          });
        }

        // 2. Books merge
        if (Array.isArray(data.books) && data.books.length > 0) {
          setBooks(prev => {
            const map = new Map();
            data.books.forEach(b => map.set(b.id, b));
            prev.forEach(b => {
              if (!map.has(b.id)) {
                map.set(b.id, b);
                saveBookToCloud(b, currentHouseId).catch(() => {});
              }
            });
            return Array.from(map.values());
          });
        }

        setCloudStatus('synced');
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('[Ledger Cloud Sync] Offline or server unreachable:', err.message);
      setCloudStatus('offline');
    }
  }, [currentHouseId]);

  useEffect(() => {
    let isMounted = true;

    fetchLedgerState(currentHouseId)
      .then(data => {
        if (!isMounted || !data?.success) return;
        if (Array.isArray(data.transactions) && data.transactions.length > 0) {
          setTransactions(prev => {
            const map = new Map();
            data.transactions.forEach(t => map.set(t.id, t));
            prev.forEach(t => {
              if (!map.has(t.id)) map.set(t.id, t);
            });
            return Array.from(map.values()).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));
          });
        } else if (transactionsRef.current.length > 0) {
          syncLedgerToCloud({ books: booksRef.current, transactions: transactionsRef.current, reminders: remindersRef.current }, currentHouseId).catch(() => {});
        }

        if (Array.isArray(data.books) && data.books.length > 0) {
          setBooks(prev => {
            const map = new Map();
            data.books.forEach(b => map.set(b.id, b));
            prev.forEach(b => {
              if (!map.has(b.id)) map.set(b.id, b);
            });
            return Array.from(map.values());
          });
        } else if (booksRef.current.length > 0) {
          syncLedgerToCloud({ books: booksRef.current, transactions: transactionsRef.current, reminders: remindersRef.current }, currentHouseId).catch(() => {});
        }
        setCloudStatus('synced');
        setLastSyncTime(new Date());
      })
      .catch(() => {
        if (isMounted) setCloudStatus('offline');
      });

    const interval = setInterval(pullCloudState, 20000);
    const onFocus = () => pullCloudState();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, [currentHouseId, pullCloudState]);

  const handleForceSync = async () => {
    setCloudStatus('syncing');
    try {
      await syncLedgerToCloud({ books, transactions, reminders }, currentHouseId);
      await pullCloudState();
      setCloudStatus('synced');
    } catch {
      setCloudStatus('offline');
    }
  };

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
    setAutoStartVoice(false);
    setIsRecordModalOpen(true);
  };

  const handleOpenIncome = () => {
    setEditingItem(null);
    setRecordModalType('income');
    setAutoStartVoice(false);
    setIsRecordModalOpen(true);
  };

  const handleOpenVoice = () => {
    setEditingItem(null);
    setRecordModalType('expense');
    setAutoStartVoice(true);
    setIsRecordModalOpen(true);
  };

  const handleEditTransaction = (item) => {
    setEditingItem(item);
    setRecordModalType(item.type);
    setAutoStartVoice(false);
    setIsRecordModalOpen(true);
  };

  const handleDeleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    deleteTransactionFromCloud(id)
      .then(() => setCloudStatus('synced'))
      .catch(() => setCloudStatus('offline'));
  };

  const handleSaveTransaction = async (item) => {
    let processedItem = item;
    if (editingItem) {
      setTransactions(prev => prev.map(t => t.id === item.id ? item : t));
    } else {
      setTransactions(prev => [item, ...prev]);
    }

    // Upload receipt photo to Supabase Storage if it's base64
    if (item.receiptPhoto && item.receiptPhoto.startsWith('data:image')) {
      try {
        const cloudUrl = await uploadReceiptPhotoToSupabase(item.receiptPhoto, item.id);
        if (cloudUrl && cloudUrl !== item.receiptPhoto) {
          processedItem = { ...item, receiptPhoto: cloudUrl };
          setTransactions(prev => prev.map(t => t.id === item.id ? processedItem : t));
        }
      } catch (e) {
        console.warn('Receipt upload exception:', e);
      }
    }

    saveTransactionToCloud(processedItem, currentHouseId)
      .then(() => setCloudStatus('synced'))
      .catch(() => setCloudStatus('offline'));
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
    saveBookToCloud(newBook, currentHouseId)
      .then(() => setCloudStatus('synced'))
      .catch(() => setCloudStatus('offline'));
  };

  const handleDeleteBook = (bookId) => {
    if (books.length <= 1) return;
    setBooks(prev => prev.filter(b => b.id !== bookId));
    if (activeBookId === bookId) {
      setActiveBookId(null);
    }
    deleteBookFromCloud(bookId)
      .then(() => setCloudStatus('synced'))
      .catch(() => setCloudStatus('offline'));
  };

  const fontScaleClass = 
    fontSize === 'huge' ? 'font-scale-huge' :
    fontSize === 'large' ? 'font-scale-large' : 'font-scale-normal';

  // IF NO ACTIVE BOOK SELECTED -> SHOW PROFILE PICKER SCREEN FIRST!
  if (!activeBookId) {
    return (
      <div className={`min-h-screen w-full bg-[#F8F7F4] ${fontScaleClass}`}>
        <ProfilePickerScreen
          books={books}
          onSelectBookWithPin={(book) => setPinModalBook(book)}
          onAddBook={handleAddBook}
          onDeleteBook={handleDeleteBook}
          transactions={transactions}
          cloudStatus={cloudStatus}
          onForceSync={handleForceSync}
          currentHouseId={currentHouseId}
          currentHouseName={currentHouseName}
          onOpenHouseManager={() => setIsHouseManagerOpen(true)}
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

        {/* Step-by-Step Onboarding Tutorial for First-Time Users */}
        <OnboardingTutorialModal
          isOpen={showTutorial}
          onClose={handleCloseTutorial}
        />

        {/* Multi-Tenant House Manager & Switcher Modal */}
        <HouseManagerModal
          isOpen={isHouseManagerOpen}
          onClose={() => setIsHouseManagerOpen(false)}
          currentHouseId={currentHouseId}
          currentHouseName={currentHouseName}
          onSwitchHouse={handleSwitchHouse}
          onUpdateHouseName={(name) => {
            setCurrentHouseName(name);
            setHouseName(currentHouseId, name);
          }}
        />
      </div>
    );
  }

  // ONCE A BOOK IS SELECTED -> SHOW THAT PERSON'S CLEAN LEDGER!
  return (
    <div className={`min-h-screen w-full bg-[#F8F7F4] text-[#2D2A26] flex flex-col overflow-x-hidden ${fontScaleClass}`}>
      {/* Top Header with Switch Button */}
      <Header
        currentBook={currentBook}
        onSwitchBook={() => setActiveBookId(null)}
        cloudStatus={cloudStatus}
        lastSyncTime={lastSyncTime}
        onForceSync={handleForceSync}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMonthlyReport={() => setIsMonthlyReportOpen(true)}
        onOpenReminders={() => setIsRemindersOpen(true)}
        pendingRemindersCount={pendingRemindersCount}
        currentHouseId={currentHouseId}
        currentHouseName={currentHouseName}
        onOpenHouseManager={() => setIsHouseManagerOpen(true)}
      />

      {/* Main Container (Responsive: Mobile 1-col, Desktop 2-col) */}
      <main className="flex-1 max-w-5xl xl:max-w-6xl w-full mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-5 pb-24 overflow-x-hidden no-print">
        {/* Optional Add-to-Home Screen prompt */}
        <InstallPromptBanner />

        {/* 2-Column Responsive Grid on Desktop */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">
          
          {/* Left Column on Desktop: Summary, Upcoming Reminder & Action Buttons */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-3 lg:space-y-4 lg:sticky lg:top-24">
            {/* Upcoming Bill / Pension Alert Pill */}
            {upcomingReminder && (
              <div className="bg-[#FAF9F5] border border-stone-300 rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-xs">
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
                  className="text-xs sm:text-sm font-bold text-stone-800 underline flex-shrink-0 cursor-pointer"
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

            {/* 2 Big Action Buttons: Expense & Income + Voice Quick Recorder */}
            <MainActionButtons
              onOpenExpense={handleOpenExpense}
              onOpenIncome={handleOpenIncome}
              onOpenVoice={handleOpenVoice}
            />
          </div>

          {/* Right Column on Desktop: Transaction History List */}
          <div className="lg:col-span-7 xl:col-span-7 mt-3 lg:mt-0 space-y-3">
            <TransactionList
              transactions={bookTransactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              soundEnabled={soundEnabled}
              currentBookName={currentBook?.name || 'ครอบครัว'}
            />
          </div>

        </div>
      </main>

      {/* Bottom Emergency Phone Bar */}
      {emergencyPhone && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 sm:px-4 lg:px-6 py-2 no-print">
          <div className="max-w-5xl xl:max-w-6xl mx-auto flex items-center justify-between gap-2">
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
        autoStartVoice={autoStartVoice}
        onClose={() => {
          setIsRecordModalOpen(false);
          setAutoStartVoice(false);
        }}
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
        currentBookName={currentBook?.name || 'ครอบครัว'}
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
        onOpenTutorial={() => setShowTutorial(true)}
        onSwitchBook={() => setActiveBookId(null)}
        cloudStatus={cloudStatus}
        lastSyncTime={lastSyncTime}
        onForceSync={handleForceSync}
        currentHouseId={currentHouseId}
        currentHouseName={currentHouseName}
        onOpenHouseManager={() => setIsHouseManagerOpen(true)}
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

      {/* Step-by-Step Onboarding Tutorial */}
      <OnboardingTutorialModal
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
      />

      {/* A4 Printable Report View (Visible only during window.print()) */}
      <PrintReportView
        selectedMonth={currentMonthStr}
        userName={currentBook?.name || 'คุณตาคุณยาย'}
        transactions={bookTransactions}
      />

      {/* Multi-Tenant House Manager & Switcher Modal */}
      <HouseManagerModal
        isOpen={isHouseManagerOpen}
        onClose={() => setIsHouseManagerOpen(false)}
        currentHouseId={currentHouseId}
        currentHouseName={currentHouseName}
        onSwitchHouse={handleSwitchHouse}
        onUpdateHouseName={(name) => {
          setCurrentHouseName(name);
          setHouseName(currentHouseId, name);
        }}
      />
    </div>
  );
}
