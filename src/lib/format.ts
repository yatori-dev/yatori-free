interface LocalDateTimeFormatOptions {
  fallback?: string;
  includeYear?: boolean;
  includeSeconds?: boolean;
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
