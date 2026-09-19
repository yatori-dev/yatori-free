interface LocalDateTimeFormatOptions {
  fallback?: string;
  includeYear?: boolean;
  includeSeconds?: boolean;
}

export function hasDeadlinePassed(endAt: number | undefined, now = Date.now()) {
  return endAt !== undefined && Number.isFinite(endAt) && endAt <= now;
}

export function getDeadlineUrgencyLabel(endAt: number | undefined, now = Date.now()) {
  if (endAt === undefined || !Number.isFinite(endAt)) return null;

  const remaining = endAt - now;
  const hour = 60 * 60 * 1000;
  if (remaining <= 0 || remaining > 24 * hour) return null;
  if (remaining <= hour) return '即将截止';
  if (remaining <= 10 * hour) return `${Math.ceil(remaining / hour)}小时内截止`;
  return '1天内截止';
}

export function formatLocalDateTime(
  value: string | number | null | undefined,
  { fallback = '未知', includeYear = false, includeSeconds = true }: LocalDateTimeFormatOptions = {},
) {
  if (value === null || value === undefined || value === '') return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${includeYear ? `${year}-` : ''}${month}-${day} ${hour}:${minute}${includeSeconds ? `:${second}` : ''}`;
}
