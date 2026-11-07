import React from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { formatCurrency } from '../utils/thaiDate';
import { playTapSound } from '../utils/audio';

export default function AccountSwitcher({
  accounts,
  activeAccountId,
  onSelectAccount,
  onOpenAccountManager,
  transactions
}) {
  // Calculate balance for each account
  const accountBalances = accounts.reduce((acc, account) => {
    const accTxs = transactions.filter(t => (t.accountId || 'acc-home') === account.id);
    const inc = accTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = accTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    acc[account.id] = inc - exp;
    return acc;
  }, {});

  return (
    <div className="mb-3 w-full no-print">
      {/* Label and Manage Button */}
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-xs font-bold text-stone-700">
          กระเป๋าเงิน / บัญชี:
        </span>
        <button
          onClick={() => {
            playTapSound();
            onOpenAccountManager();
          }}
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 underline cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>จัดการบัญชี</span>
        </button>
      </div>

      {/* Account Pills list */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {/* All Accounts Combined Pill */}
        <button
          onClick={() => {
            playTapSound();
            onSelectAccount('all');
          }}
          className={`btn-tactile px-3 py-1.5 rounded-xl border text-left flex items-center gap-1.5 flex-shrink-0 cursor-pointer transition-all ${
            activeAccountId === 'all'
              ? 'bg-stone-800 border-stone-900 text-white shadow-xs'
              : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-sm">✨</span>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight whitespace-nowrap">รวมทุกบัญชี</div>
          </div>
        </button>

        {/* Individual Account Pills */}
        {accounts.map((acc) => {
          const isActive = activeAccountId === acc.id;
          const bal = accountBalances[acc.id] || 0;

          return (
            <button
              key={acc.id}
              onClick={() => {
                playTapSound();
                onSelectAccount(acc.id);
              }}
              className={`btn-tactile px-3 py-1.5 rounded-xl border text-left flex items-center gap-1.5 flex-shrink-0 cursor-pointer transition-all ${
                isActive
                  ? 'bg-stone-800 border-stone-900 text-white shadow-xs'
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span className="text-sm flex-shrink-0">{acc.icon}</span>
              <div className="text-left min-w-0">
                <div className="text-xs font-bold leading-tight whitespace-nowrap truncate max-w-[120px]">
                  {acc.name}
                </div>
                <div className={`text-xs leading-normal font-medium font-['Prompt'] whitespace-nowrap ${
                  isActive ? 'text-stone-300' : 'text-stone-500'
                }`}>
                  ฿{formatCurrency(bal)}
                </div>
              </div>
            </button>
          );
        })}

        {/* Add account button */}
        <button
          onClick={() => {
            playTapSound();
            onOpenAccountManager();
          }}
          className="btn-tactile p-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-600 flex items-center justify-center flex-shrink-0 cursor-pointer"
          title="เพิ่มบัญชีใหม่"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
