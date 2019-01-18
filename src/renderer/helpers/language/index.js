import { names, codes } from './allLanguages';

export function normalizeCode(code) {
  const result = Object.keys(codes).find(name => codes[name].includes(code));
  return result || 'none';
}

export function codeToLanguageName(code) {
  const standardCode = normalizeCode(code);
  return standardCode === 'none' ? 'none' : names[standardCode];
}

export function codeIndex(code) {
  return Object.keys(codes).indexOf(normalizeCode(code));
}
