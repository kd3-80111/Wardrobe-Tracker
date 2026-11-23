const DAY = 24 * 60 * 60 * 1000

export function daysSince(iso, now = Date.now()) {
  if (!iso) return Infinity
  const time = new Date(iso).getTime()
  return Number.isNaN(time) ? Infinity : Math.floor((now - time) / DAY)
}

export function relativeDay(iso, now = Date.now()) {
  const days = daysSince(iso, now)
  if (days === Infinity) return 'never'
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  if (days < 60) return `${Math.round(days / 7)} weeks ago`
  if (days < 730) return `${Math.round(days / 30)} months ago`
  return `${Math.round(days / 365)} years ago`
}
