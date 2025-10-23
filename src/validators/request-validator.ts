import { SUPPORTED_SYMBOLS } from '../config';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateSymbols(symbols: string[]): string[] {
  if (!symbols || symbols.length === 0) {
    throw new ValidationError('No symbols provided');
  }

  const supportedSymbolsList = SUPPORTED_SYMBOLS.map(s => s.symbol);
  const invalidSymbols = symbols.filter(s => !supportedSymbolsList.includes(s));

  if (invalidSymbols.length > 0) {
    throw new ValidationError(
      `Invalid symbols: ${invalidSymbols.join(', ')}. Supported symbols: ${supportedSymbolsList.join(', ')}`
    );
  }

  return symbols;
}

export function parseSymbolsFromUrl(url: URL): string[] {
  const symbolsParam = url.searchParams.get('symbols');
  
  if (!symbolsParam) {
    return SUPPORTED_SYMBOLS.map(s => s.symbol);
  }

  const symbols = symbolsParam.split(',').map(s => s.trim()).filter(s => s.length > 0);
  return validateSymbols(symbols);
}
