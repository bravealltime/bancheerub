// House & Multi-Family Multi-Tenancy Manager for Bancheerub
// Allows each family to have their own isolated cloud ledger and invite links

const STORAGE_KEY_ACTIVE_HOUSE = 'banchee_active_house_id';
const STORAGE_KEY_HOUSE_LIST = 'banchee_saved_houses';
const STORAGE_KEY_HOUSE_NAMES = 'banchee_house_names';

export const DEFAULT_MAIN_HOUSE_ID = 'family-main';

/**
 * Generate a friendly 6-character house code e.g. HOME-7492
 */
export function generateHouseCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `HOME-${num}`;
}

/**
 * Clean and normalize house code input
 */
export function normalizeHouseCode(raw) {
  if (!raw) return '';
  let clean = raw.trim().toUpperCase();
  if (!clean.startsWith('HOME-') && /^\d{4}$/.test(clean)) {
    clean = `HOME-${clean}`;
  }
  return clean;
}

/**
 * Get active house ID from URL query param (?house=... or ?family=...) or localStorage
 */
export function getInitialHouseId() {
  if (typeof window === 'undefined') return DEFAULT_MAIN_HOUSE_ID;

  // 1. Check URL query params e.g. https://bancheerub.vercel.app/?house=HOME-8899
  try {
    const params = new URLSearchParams(window.location.search);
    const queryHouse = params.get('house') || params.get('family');
    if (queryHouse && queryHouse.trim()) {
      const normalized = normalizeHouseCode(queryHouse);
      localStorage.setItem(STORAGE_KEY_ACTIVE_HOUSE, normalized);
      saveHouseToList(normalized, `บ้าน ${normalized}`);
      
      // Clean query parameter from browser address bar smoothly without reloading
      const url = new URL(window.location);
      url.searchParams.delete('house');
      url.searchParams.delete('family');
      window.history.replaceState({}, '', url.pathname + url.search);

      return normalized;
    }
  } catch (e) {
    console.warn('Error reading URL params for house code:', e);
  }

  // 2. Check localStorage
  const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE_HOUSE);
  if (savedActive && savedActive.trim()) {
    return savedActive.trim();
  }

  // 3. Check if user already had legacy transactions
  const hasLegacyData = localStorage.getItem('banchee_transactions');
  if (hasLegacyData) {
    localStorage.setItem(STORAGE_KEY_ACTIVE_HOUSE, DEFAULT_MAIN_HOUSE_ID);
    saveHouseToList(DEFAULT_MAIN_HOUSE_ID, 'บ้านครอบครัวเดิม (หลัก)');
    return DEFAULT_MAIN_HOUSE_ID;
  }

  // 4. Default to standard main house
  localStorage.setItem(STORAGE_KEY_ACTIVE_HOUSE, DEFAULT_MAIN_HOUSE_ID);
  saveHouseToList(DEFAULT_MAIN_HOUSE_ID, 'บ้านครอบครัว (หลัก)');
  return DEFAULT_MAIN_HOUSE_ID;
}

/**
 * Get user-assigned display name for a house ID
 */
export function getHouseName(houseId) {
  if (!houseId) return 'บ้านครอบครัว';
  if (houseId === DEFAULT_MAIN_HOUSE_ID) return 'บ้านครอบครัว (หลัก)';

  try {
    const names = JSON.parse(localStorage.getItem(STORAGE_KEY_HOUSE_NAMES) || '{}');
    if (names[houseId]) return names[houseId];
  } catch {}

  return `บ้าน ${houseId}`;
}

/**
 * Set custom display name for a house ID
 */
export function setHouseName(houseId, newName) {
  if (!houseId || !newName) return;
  try {
    const names = JSON.parse(localStorage.getItem(STORAGE_KEY_HOUSE_NAMES) || '{}');
    names[houseId] = newName.trim();
    localStorage.setItem(STORAGE_KEY_HOUSE_NAMES, JSON.stringify(names));
    saveHouseToList(houseId, newName.trim());
  } catch {}
}

/**
 * Get list of all houses saved/accessed on this device
 */
export function getSavedHouses() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY_HOUSE_LIST) || '[]');
    if (Array.isArray(list) && list.length > 0) return list;
  } catch {}

  const defaultList = [{
    id: DEFAULT_MAIN_HOUSE_ID,
    name: 'บ้านครอบครัว (หลัก)',
    updatedAt: Date.now()
  }];
  return defaultList;
}

/**
 * Save or update a house in local saved list
 */
export function saveHouseToList(houseId, houseName) {
  if (!houseId) return;
  try {
    const list = getSavedHouses().filter(h => h.id !== houseId);
    list.unshift({
      id: houseId,
      name: houseName || getHouseName(houseId),
      updatedAt: Date.now()
    });
    localStorage.setItem(STORAGE_KEY_HOUSE_LIST, JSON.stringify(list.slice(0, 10)));
  } catch {}
}

/**
 * Remove a house from local saved list
 */
export function removeHouseFromList(houseId) {
  try {
    const list = getSavedHouses().filter(h => h.id !== houseId);
    localStorage.setItem(STORAGE_KEY_HOUSE_LIST, JSON.stringify(list));
  } catch {}
}

/**
 * Generate 1-tap invite URL for a house
 */
export function getHouseInviteUrl(houseId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bancheerub.vercel.app';
  return `${origin}/?house=${encodeURIComponent(houseId)}`;
}

/**
 * Check if the user has already configured a custom name for this house or finished setup
 */
export function hasConfiguredHouseName(houseId) {
  if (!houseId) return false;
  if (typeof localStorage === 'undefined') return false;
  try {
    const isDone = localStorage.getItem(`banchee_house_setup_done_${houseId}`);
    if (isDone === 'true') return true;
    const names = JSON.parse(localStorage.getItem(STORAGE_KEY_HOUSE_NAMES) || '{}');
    return Boolean(names[houseId] && names[houseId].trim());
  } catch {
    return false;
  }
}

/**
 * Mark that initial house setup has been shown/completed
 */
export function markHouseSetupDone(houseId) {
  if (!houseId) return;
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`banchee_house_setup_done_${houseId}`, 'true');
  } catch {}
}
