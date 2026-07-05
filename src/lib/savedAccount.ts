export interface SavedAccount {
  account: string;
}

const SAVED_ACCOUNT_KEY = 'yatori_saved_account_only';
const LEGACY_CREDENTIALS_KEY = 'yatori_saved_credentials';
const LEGACY_ACCOUNT_KEY = 'yatori_saved_account';
const LEGACY_PASSWORD_KEY = 'yatori_saved_password';
const LEGACY_DB_NAME = 'yatori-secure-store';

function isSavedAccount(value: unknown): value is SavedAccount {
  return (
    value !== null &&
    typeof value === 'object' &&
    'account' in value &&
    typeof value.account === 'string'
  );
}

function readLegacyPlainAccount() {
  const rawCredentials = localStorage.getItem(LEGACY_CREDENTIALS_KEY);
  if (rawCredentials) {
    try {
      const parsed: unknown = JSON.parse(rawCredentials);
      if (isSavedAccount(parsed)) {
        return parsed.account;
      }
    } catch (error) {
      console.error('Failed to parse legacy saved account', error);
    }
  }

  return localStorage.getItem(LEGACY_ACCOUNT_KEY);
}

function clearLegacySavedCredentials() {
  localStorage.removeItem(LEGACY_CREDENTIALS_KEY);
  localStorage.removeItem(LEGACY_ACCOUNT_KEY);
  localStorage.removeItem(LEGACY_PASSWORD_KEY);

  if (window.indexedDB) {
    window.indexedDB.deleteDatabase(LEGACY_DB_NAME);
  }
}

export async function readSavedAccount(): Promise<SavedAccount | null> {
  const raw = localStorage.getItem(SAVED_ACCOUNT_KEY);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSavedAccount(parsed) && parsed.account.trim()) {
        clearLegacySavedCredentials();
        return {
          account: parsed.account.trim(),
        };
      }
    } catch (error) {
      console.error('Failed to parse saved account', error);
    }
  }

  const legacyAccount = readLegacyPlainAccount();
  clearLegacySavedCredentials();

  if (!legacyAccount?.trim()) {
    localStorage.removeItem(SAVED_ACCOUNT_KEY);
    return null;
  }

  const account = {
    account: legacyAccount.trim(),
  };
  saveSavedAccount(account);
  return account;
}

export function saveSavedAccount(account: SavedAccount) {
  localStorage.setItem(SAVED_ACCOUNT_KEY, JSON.stringify({
    account: account.account.trim(),
  }));
  clearLegacySavedCredentials();
}

export function clearSavedAccount() {
  localStorage.removeItem(SAVED_ACCOUNT_KEY);
  clearLegacySavedCredentials();
}
