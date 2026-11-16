// 서버의 LocalDateTime 문자열("2026-12-16T13:00:00[.ffffff]")을 다룬다

// "2026-12-16T13:00:00" → "2026년 12월 16일 13:00"
export function formatSlotDatetime(value: string): string {
  const [date, time = ''] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일 ${time.slice(0, 5)}`;
}

// 시간대 표기가 없는 서버 시각을 기기 현지 시각으로 해석해 epoch ms 로 바꾼다
export function parseLocalDateTime(value: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?/.exec(value);
  if (!m) return NaN;
  const [, y, mo, d, h, mi, s = '0', ms = '0'] = m;
  return new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s),
    Number(ms.padEnd(3, '0')),
  ).getTime();
}
