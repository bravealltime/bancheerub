// HomeSpace Cloud API Client for สมุดเงินทอง (Bancheerub)
// Synchronized with HomeSpace backend & Supabase Storage

const DEFAULT_API_URL = 'https://homespace-rose.vercel.app/api/ledger';

export function getLedgerApiUrl() {
  if (typeof localStorage !== 'undefined') {
    const custom = localStorage.getItem('bancheerub_custom_api_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  return DEFAULT_API_URL;
}

/**
 * Fetch full cloud state (books + transactions + reminders)
 */
export async function fetchLedgerState(familyId = 'family-main') {
  const baseUrl = getLedgerApiUrl();
  const res = await fetch(`${baseUrl}/state?familyId=${encodeURIComponent(familyId)}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return await res.json();
}

/**
 * Push local state to cloud (Used on initial migration or manual sync)
 */
export async function syncLedgerToCloud(data, familyId = 'family-main') {
  const baseUrl = getLedgerApiUrl();
  const res = await fetch(`${baseUrl}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      familyId,
      books: data.books || [],
      transactions: data.transactions || [],
      reminders: data.reminders || [],
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return await res.json();
}

/**
 * Save single transaction to cloud
 */
export async function saveTransactionToCloud(tx, familyId = 'family-main') {
  const baseUrl = getLedgerApiUrl();
  const res = await fetch(`${baseUrl}/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...tx,
      familyId,
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return await res.json();
}

/**
 * Delete transaction from cloud
 */
export async function deleteTransactionFromCloud(id) {
  const baseUrl = getLedgerApiUrl();
  const res = await fetch(`${baseUrl}/transaction/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return await res.json();
}

/**
 * Save single book (profile) to cloud
 */
export async function saveBookToCloud(book, familyId = 'family-main') {
  const baseUrl = getLedgerApiUrl();
  const res = await fetch(`${baseUrl}/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...book,
      familyId,
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return await res.json();
}

/**
 * Delete book from cloud
 */
export async function deleteBookFromCloud(id) {
  const baseUrl = getLedgerApiUrl();
  const res = await fetch(`${baseUrl}/book/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return await res.json();
}
