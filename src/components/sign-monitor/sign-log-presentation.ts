import type { SignLog } from '@/lib/api';

export const SIGN_TYPE_BADGES = [
  {
    label: '普通签到',
    className: 'border-info/25 bg-info-container/60 text-info',
  },
  {
    label: '手势签到',
    className: 'border-warning/25 bg-warning-container/60 text-warning',
  },
  {
    label: '位置签到',
    className: 'border-sign-location/25 bg-sign-location-container/60 text-sign-location',
  },
  {
    label: '签到码',
    className: 'border-sign-code/25 bg-sign-code-container/60 text-sign-code',
  },
] as const;

export function getSignTypeBadge(log: SignLog) {
  const value = `${log.signType ?? ''} ${log.signName ?? ''}`;

  if (value.includes('位置')) return SIGN_TYPE_BADGES[2];
  if (value.includes('手势')) return SIGN_TYPE_BADGES[1];
  if (value.includes('签到码') || value.includes('二维码')) return SIGN_TYPE_BADGES[3];
  return SIGN_TYPE_BADGES[0];
}

export function isSignResultSuccess(result: string) {
  return result.includes('成功') || result.includes('完成') || result.includes('已签到');
}

export function getSignResultClassName(result: string) {
  if (isSignResultSuccess(result)) {
    return 'border-success/25 bg-success-container/60 text-success';
  }
  if (result.includes('失败') || result.includes('异常')) {
    return 'border-danger/25 bg-danger-container/60 text-danger';
  }
  return 'border-border bg-muted text-muted-foreground';
}

export function getSignLogTimestamp(log: SignLog) {
  return log.activityTime ?? log.submittedAt ?? log.createdAt;
}

export function getSignLogTimeValue(log: SignLog) {
  const value = Date.parse(getSignLogTimestamp(log));
  return Number.isFinite(value) ? value : 0;
}
