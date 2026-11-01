import { describe, expect, it } from 'vitest'

import { expiryLabel, formatDate, formatInr, formatPhone, whatsappReminderLink } from './format'

describe('formatInr', () => {
  it('formats paise as rupees with Indian grouping', () => {
    expect(formatInr(120000)).toBe('₹1,200')
    expect(formatInr(1080000)).toBe('₹10,800')
    expect(formatInr(1234567800)).toBe('₹1,23,45,678')
    expect(formatInr(0)).toBe('₹0')
    expect(formatInr(150)).toBe('₹1.5')
  })
})

describe('formatDate', () => {
  it('prints the calendar day without shifting it', () => {
    expect(formatDate('2026-12-01')).toBe('1 Dec 2026')
    expect(formatDate('2027-02-28')).toBe('28 Feb 2027')
  })
})

describe('expiryLabel', () => {
  it('uses the prototype wording', () => {
    expect(expiryLabel(-1, '2026-10-31')).toBe('Expired 1 day ago')
    expect(expiryLabel(-12, '2026-10-20')).toBe('Expired 12 days ago')
    expect(expiryLabel(0, '2026-11-01')).toBe('Expires today')
    expect(expiryLabel(1, '2026-11-02')).toBe('Expires in 1 day')
    expect(expiryLabel(7, '2026-11-08')).toBe('Expires in 7 days')
    expect(expiryLabel(8, '2026-11-09')).toBe('9 Nov 2026')
    expect(expiryLabel(null, null)).toBe('No membership')
  })
})

describe('whatsappReminderLink', () => {
  it('adds the country code and encodes the message', () => {
    const link = whatsappReminderLink('9822011101', 'Rohan Naik', 'Panaji Iron Works')
    const url = new URL(link)

    expect(url.origin + url.pathname).toBe('https://wa.me/919822011101')
    expect(url.searchParams.get('text')).toMatch(/^Hello Rohan Naik, this is a friendly reminder from Panaji Iron Works\./)
  })

  it('encodes names that would break a URL', () => {
    const url = new URL(whatsappReminderLink('9822011101', 'A & B #1', 'Gym?'))
    expect(url.searchParams.get('text')).toContain('Hello A & B #1, this is a friendly reminder from Gym?.')
  })
})

describe('formatPhone', () => {
  it('groups a 10-digit number with +91', () => {
    expect(formatPhone('9822011101')).toBe('+91 98220 11101')
  })
})
