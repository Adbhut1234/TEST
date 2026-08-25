export function normalizeString(str?: string) {
  if (!str) return ''
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function normalizeNumbers(str?: string) {
  if (!str) return ''
  const hindiNum = ['०','१','२','३','४','५','६','७','८','९']
  let res = ''
  for (const char of str) {
    const idx = hindiNum.indexOf(char)
    res += idx !== -1 ? idx.toString() : char
  }
  return res
}

export function parseArea(str?: string) {
  if (!str) return NaN
  const norm = normalizeNumbers(str).toLowerCase()
  let val = parseFloat(norm.replace(/[^0-9.]/g, ''))
  
  if (isNaN(val)) return NaN

  if (norm.includes('hectare') || norm.includes('hec') || norm.includes('हेक्टेयर')) {
    val = val * 10000 // Convert to sq meters
  } else if (norm.includes('acre')) {
    val = val * 4046.86 // Convert to sq meters
  }
  return val
}
