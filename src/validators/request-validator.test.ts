import { describe, it, expect } from 'vitest';
import { validateSymbols, parseSymbolsFromUrl, ValidationError } from './request-validator';

describe('request-validator', () => {
  describe('validateSymbols', () => {
    it('should accept valid symbols', () => {
      const symbols = ['XAUUSD=X', 'XAGUSD=X'];
      const result = validateSymbols(symbols);

      expect(result).toEqual(symbols);
    });

    it('should accept all supported symbols', () => {
      const symbols = ['XAUUSD=X', 'XAGUSD=X', 'GC=F', 'SI=F'];
      const result = validateSymbols(symbols);

      expect(result).toEqual(symbols);
    });

    it('should throw ValidationError for invalid symbols', () => {
      const symbols = ['XAUUSD=X', 'INVALID'];

      expect(() => validateSymbols(symbols)).toThrow(ValidationError);
      expect(() => validateSymbols(symbols)).toThrow('Invalid symbols: INVALID');
    });

    it('should throw ValidationError for empty array', () => {
      expect(() => validateSymbols([])).toThrow(ValidationError);
      expect(() => validateSymbols([])).toThrow('No symbols provided');
    });

    it('should throw ValidationError for multiple invalid symbols', () => {
      const symbols = ['INVALID1', 'INVALID2', 'XAUUSD=X'];

      expect(() => validateSymbols(symbols)).toThrow(ValidationError);
      expect(() => validateSymbols(symbols)).toThrow('INVALID1');
      expect(() => validateSymbols(symbols)).toThrow('INVALID2');
    });
  });

  describe('parseSymbolsFromUrl', () => {
    it('should parse symbols from URL query parameter', () => {
      const url = new URL('https://example.com/api/quotes?symbols=XAUUSD=X,XAGUSD=X');
      const result = parseSymbolsFromUrl(url);

      expect(result).toEqual(['XAUUSD=X', 'XAGUSD=X']);
    });

    it('should return all supported symbols when no parameter provided', () => {
      const url = new URL('https://example.com/api/quotes');
      const result = parseSymbolsFromUrl(url);

      expect(result).toEqual(['XAUUSD=X', 'XAGUSD=X', 'GC=F', 'SI=F', 'au0', 'ag0']);
    });

    it('should trim whitespace from symbols', () => {
      const url = new URL('https://example.com/api/quotes?symbols=XAUUSD=X , XAGUSD=X');
      const result = parseSymbolsFromUrl(url);

      expect(result).toEqual(['XAUUSD=X', 'XAGUSD=X']);
    });

    it('should filter out empty symbols', () => {
      const url = new URL('https://example.com/api/quotes?symbols=XAUUSD=X,,XAGUSD=X');
      const result = parseSymbolsFromUrl(url);

      expect(result).toEqual(['XAUUSD=X', 'XAGUSD=X']);
    });

    it('should throw ValidationError for invalid symbols in URL', () => {
      const url = new URL('https://example.com/api/quotes?symbols=INVALID');

      expect(() => parseSymbolsFromUrl(url)).toThrow(ValidationError);
    });

    it('should handle single symbol', () => {
      const url = new URL('https://example.com/api/quotes?symbols=GC=F');
      const result = parseSymbolsFromUrl(url);

      expect(result).toEqual(['GC=F']);
    });
  });
});
