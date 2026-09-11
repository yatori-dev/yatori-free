import type { SignLog } from '@/lib/api';

export const SIGN_TYPE_BADGES = [
  {
    label: '普通签到',
    className: 'border-info/20 bg-info-container/30 text-info',
  },
  {
    label: '拍照签到',
    className: 'border-sign-photo/20 bg-sign-photo-container/30 text-sign-photo',
  },
  {
    label: '手势签到',
    className: 'border-warning/20 bg-warning-container/30 text-warning',
  },
  {
    label: '位置签到',
    className: 'border-sign-location/20 bg-sign-location-container/30 text-sign-location',
  },
  {
    label: '签到码签到',
    className: 'border-sign-code/20 bg-sign-code-container/30 text-sign-code',
  },
] as const;

export function getSignTypeBadge(log: SignLog) {
  const value = log.signType?.toLowerCase() ?? '';

  if (value.includes('photo') || value.includes('拍照')) return SIGN_TYPE_BADGES[1];
  if (value.includes('位置')) return SIGN_TYPE_BADGES[3];
  if (value.includes('location')) return SIGN_TYPE_BADGES[3];
  if (value.includes('gesture') || value.includes('手势')) return SIGN_TYPE_BADGES[2];
  if (value.includes('code') || value.includes('二维码') || value.includes('签到码')) return SIGN_TYPE_BADGES[4];
  return SIGN_TYPE_BADGES[0];
}

export function getSignDisplayName(log: SignLog) {
  return getSignTypeBadge(log).label;
}

export function getSignResult(log: SignLog) {
  if (log.submittedAt) return '已签到';
  if (log.personalStatus === 0) return '未签到';
  if (log.personalStatus !== undefined && log.personalStatus !== null) {
    return `状态 ${log.personalStatus}`;
  }
  return '未签到';
}

export function isSignResultSuccess(log: SignLog) {
  return Boolean(log.submittedAt);
}

export function getSignResultClassName(log: SignLog) {
  if (isSignResultSuccess(log)) {
    return 'border-success/30 bg-success-container/40 text-success';
  }
  return 'border-border bg-muted/40 text-muted-foreground';
}

export function getSignLogTimestamp(log: SignLog) {
  return log.activityTime ?? log.submittedAt ?? log.createdAt;
}

export function getSignLogTimeValue(log: SignLog) {
  const value = Date.parse(getSignLogTimestamp(log));
  return Number.isFinite(value) ? value : 0;
}

export function compareSignLogsNewestFirst(left: SignLog, right: SignLog) {
  return getSignLogTimeValue(right) - getSignLogTimeValue(left);
}
