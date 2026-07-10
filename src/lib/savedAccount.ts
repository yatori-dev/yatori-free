export interface SavedAccount {
  account: string;
}

const SAVED_ACCOUNT_KEY = 'yatori_saved_account_only';
const LEGACY_STORAGE_KEYS = [
  'yatori_saved_credentials',
  'yatori_saved_account',
  'yatori_saved_password',
] as const;
const LEGACY_DB_NAME = 'yatori-secure-store';

function isSavedAccount(value: unknown): value is SavedAccount {
  return (
    value !== null &&
    typeof value === 'object' &&
    'account' in value &&
    typeof value.account === 'string'
  );
}

function clearDeprecatedCredentials() {
  LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  window.indexedDB?.deleteDatabase(LEGACY_DB_NAME);
}

export async function readSavedAccount(): Promise<SavedAccount | null> {
  clearDeprecatedCredentials();
  const raw = localStorage.getItem(SAVED_ACCOUNT_KEY);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSavedAccount(parsed) && parsed.account.trim()) {
        return {
          account: parsed.account.trim(),
        };
      }
    } catch (error) {
      console.error('Failed to parse saved account', error);
    }
  }

  localStorage.removeItem(SAVED_ACCOUNT_KEY);
  return null;
}

export function saveSavedAccount(account: SavedAccount) {
  localStorage.setItem(SAVED_ACCOUNT_KEY, JSON.stringify({
    account: account.account.trim(),
  }));
  clearDeprecatedCredentials();
}

export function clearSavedAccount() {
  localStorage.removeItem(SAVED_ACCOUNT_KEY);
  clearDeprecatedCredentials();
}
