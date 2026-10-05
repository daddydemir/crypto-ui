export function formatCompactNumber(value: number, locale = 'tr-TR') {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatAxisDate(value: string | number, locale: string, compact = false) {
  const date = new Date(value)
  return date.toLocaleDateString(locale, compact
    ? { day: 'numeric', month: 'short' }
    : { month: 'short', year: '2-digit' })
}

export function downsample<T>(data: T[], maxPoints: number) {
  if (data.length <= maxPoints) return data
  const step = (data.length - 1) / (maxPoints - 1)
  return Array.from({ length: maxPoints }, (_, index) => data[Math.round(index * step)])
}
