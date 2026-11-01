// Display helpers. Money arrives as integer paise and dates as YYYY-MM-DD calendar days in the
// gym's timezone, so neither is ever passed through floating point or a timezone conversion.

const inrFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

/** 120000 paise → "₹1,200"; keeps paise only when there are some. */
export function formatInr(paise: number): string {
  return '₹' + inrFormatter.format(paise / 100)
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** "2026-12-01" → "1 Dec 2026". Parsed as UTC midnight and printed in UTC, so no day shift. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)))
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

/** A payment timestamp in the viewer's local time, e.g. "1 Nov, 7:32 pm". */
export function formatDateTime(isoTimestamp: string): string {
  return dateTimeFormatter.format(new Date(isoTimestamp))
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/** The prototype's expiry wording. */
export function expiryLabel(daysToExpiry: number | null, endDate: string | null): string {
  if (daysToExpiry === null || endDate === null) return 'No membership'
  if (daysToExpiry < 0) return `Expired ${plural(-daysToExpiry, 'day')} ago`
  if (daysToExpiry === 0) return 'Expires today'
  if (daysToExpiry <= 7) return `Expires in ${plural(daysToExpiry, 'day')}`
  return formatDate(endDate)
}

/** A wa.me link with the prototype's reminder text, for a 10-digit Indian mobile number. */
export function whatsappReminderLink(phone: string, memberName: string, gymName: string): string {
  const digits = phone.replace(/\D/g, '')
  const international = digits.length === 10 ? '91' + digits : digits
  const text =
    `Hello ${memberName}, this is a friendly reminder from ${gymName}. Your gym membership has expired. ` +
    `Please clear your dues at the front desk via Cash or UPI to continue your workouts. Thank you!`
  return `https://wa.me/${international}?text=${encodeURIComponent(text)}`
}

/** "9822011101" → "+91 98220 11101". */
export function formatPhone(phone: string): string {
  return phone.length === 10 ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : phone
}

/** "just now", "5 min ago", "3 h ago", "2 days ago"; older than a week shows the date. */
export function relativeTime(isoTimestamp: string, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - new Date(isoTimestamp).getTime()) / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days <= 7) return plural(days, 'day') + ' ago'
  return formatDateTime(isoTimestamp)
}

const timeFormatter = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' })

/** A punch time, e.g. "6:15 am". */
export function formatTime(isoTimestamp: string): string {
  return timeFormatter.format(new Date(isoTimestamp))
}

const VERIFY_LABELS: Record<string, string> = { face: 'Face', fingerprint: 'Fingerprint', card: 'Card', password: 'PIN code', palm: 'Palm' }

export function verifyLabel(method: string): string {
  return VERIFY_LABELS[method] ?? 'Other'
}
