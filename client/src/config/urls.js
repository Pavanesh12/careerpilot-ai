export function normalizeExternalUrl(value) {
  if (typeof value !== 'string') return ''

  const trimmedValue = value.trim()
  if (!trimmedValue) return ''

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue
  }

  return `https://${trimmedValue}`
}
