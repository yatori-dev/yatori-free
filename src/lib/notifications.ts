import { toast } from 'sonner';

const UNAUTHORIZED_TOAST_ID = 'unauthorized-session-expired';

export function notifyAuthExit(message = '登录已失效，请重新登录') {
  toast.error(message, {
    id: UNAUTHORIZED_TOAST_ID,
  });
}

export const notifyUnauthorized = notifyAuthExit;
