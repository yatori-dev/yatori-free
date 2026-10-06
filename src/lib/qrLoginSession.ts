import type { QRSessionData } from './api';

const QR_LOGIN_SESSION_KEY = 'yatori-qr-login-session';

export interface StoredQRLoginSession extends QRSessionData {
  qrContent: string;
}

function isStoredQRLoginSession(value: unknown): value is StoredQRLoginSession {
  if (
    value === null ||
    typeof value !== 'object' ||
    !('id' in value) ||
    !('status' in value) ||
    !('expiresAt' in value) ||
    !('pollIntervalMs' in value) ||
    !('qrContent' in value)
  ) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.status === 'string' &&
    ['pending', 'scanned'].includes(value.status) &&
    typeof value.expiresAt === 'string' &&
    typeof value.pollIntervalMs === 'number' &&
    Number.isFinite(value.pollIntervalMs) &&
    typeof value.qrContent === 'string' &&
    value.qrContent.length > 0
  );
}

function isExpired(expiresAt: string) {
  const expiresAtMs = Date.parse(expiresAt);
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now();
}

export function readQRLoginSession() {
  const raw = sessionStorage.getItem(QR_LOGIN_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isStoredQRLoginSession(parsed) && !isExpired(parsed.expiresAt)) {
      return parsed;
    }
  } catch {
    // Invalid session data is removed by the cleanup below.
  }

  sessionStorage.removeItem(QR_LOGIN_SESSION_KEY);
  return null;
}

export function writeQRLoginSession(session: QRSessionData) {
  if (
    !session.qrContent ||
    !['pending', 'scanned'].includes(session.status) ||
    isExpired(session.expiresAt)
  ) {
    clearQRLoginSession();
    return;
  }

  const storedSession: StoredQRLoginSession = {
    ...session,
    qrContent: session.qrContent,
  };
  sessionStorage.setItem(QR_LOGIN_SESSION_KEY, JSON.stringify(storedSession));
}

export function clearQRLoginSession() {
  sessionStorage.removeItem(QR_LOGIN_SESSION_KEY);
}
