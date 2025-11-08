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
