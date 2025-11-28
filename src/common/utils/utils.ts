import slugify from 'slugify';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function toBase62(num: number): string {
  if (num === 0) return ALPHABET[0];
  const base = ALPHABET.length;
  let result = '',
    n = num;
  while (n > 0) {
    const remainder = n % base;
    result = ALPHABET[remainder] + result;
    n = Math.floor(n / base);
  }
  return result;
}

export function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function toLocaleNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

export function throttle<T extends (...args: any[]) => void>(fn: T, wait: number): T {
  let lastTime = 0;
  return function (this: any, ...args: any[]) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn.apply(this, args);
    }
  } as T;
}

/**
 * Removes an element from an array in-place.
 */
export function arrayRemove<T>(array: T[], element: T) {
  const index = array.indexOf(element);
  if (index !== -1) {
    array.splice(index, 1);
  }
}

/**
 * Returns a random alphanumeric ID with ~17 characters.
 */
export function randomId() {
  const timePart = toBase62(Date.now());
  const randomPart = toBase62(Math.floor(Math.random() * 1e15));
  return `${timePart}.${randomPart}`;
}

/**
 * Builds a randomized id based on a name and millisecond-based unix timestmap.
 */
export function buildId(name: string, timestamp: number) {
  const slug = slugify(name, {
    strict: true,
    lower: true,
  });
  const code = toBase62(timestamp);
  const id = `${slug}-${code}`;
  return id;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);
  Object.values(obj).forEach((val) => {
    if (val && typeof val === 'object') {
      deepFreeze(val);
    }
  });
  return obj;
}

/**
 * Verifies if a string (query) is a substring of a larger text (text),
 * ignoring leading and trailing whitespaces, and ignoring case.
 */
export function isSubstring(text: string, query: string) {
  return text.trim().toLowerCase().includes(query.trim().toLowerCase());
}

/**
 * Returns true if *every* string in query is contained in base
 * (match ALL).
 */
export function arrayContainsAll(base: string[], query: string[]) {
  return query.every((q) => base.includes(q));
}

/**
 * Returns true if *any* string in query is contained in base
 * (match ANY).
 */
export function arrayContainsAny(base: string[], query: string[]) {
  return query.some((q) => base.includes(q));
}
