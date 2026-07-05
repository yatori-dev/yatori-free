import { toast } from 'sonner';

const UNAUTHORIZED_TOAST_ID = 'unauthorized-session-expired';

export function notifyUnauthorized() {
  toast.error('登录已失效，请重新登录', {
    id: UNAUTHORIZED_TOAST_ID,
  });
}
