import { normalizeString, normalizeNumbers, parseArea } from './validation'

describe('Validation Engine', () => {
  describe('normalizeString', () => {
    it('removes spaces, special characters, and lowercases', () => {
      expect(normalizeString('RamESH KumaR')).toBe('rameshkumar')
      expect(normalizeString('Ramesh-Kumar ')).toBe('rameshkumar')
      expect(normalizeString(undefined)).toBe('')
    })
  })

  describe('normalizeNumbers', () => {
    it('converts Hindi numerals to Arabic', () => {
      expect(normalizeNumbers('१२३')).toBe('123')
      expect(normalizeNumbers('९०')).toBe('90')
      expect(normalizeNumbers('123')).toBe('123') // Should leave english alone
    })
  })

  describe('parseArea', () => {
    it('parses direct numbers', () => {
      expect(parseArea('1.5')).toBe(1.5)
      expect(parseArea('0.05')).toBe(0.05)
    })

    it('converts hectares to square meters', () => {
      expect(parseArea('1.5 hectare')).toBe(15000)
      expect(parseArea('2 HEC')).toBe(20000)
      expect(parseArea('०.५ हेक्टेयर')).toBe(5000) // Hindi digits + hindi word
    })

    it('converts acres to square meters', () => {
      expect(parseArea('1 acre')).toBe(4046.86)
      expect(parseArea('2 ACRES')).toBe(8093.72)
    })
    
    it('returns NaN for invalid strings', () => {
      expect(parseArea('invalid string')).toBeNaN()
    })
  })
})
