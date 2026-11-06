// @ts-check
/**
 * @fileoverview Cryptographic Seal Utility (VetTrack Standard - Universal Node/Browser)
 *
 * Sello criptográfico SHA-256 universal para actas sanitarias de vacunación SENASA,
 * despachos de tropa y comprobantes de carencia farmacológica.
 * Funciona de forma 100% autónoma en Node.js y en el Navegador Web (Zero Dependencies).
 */

/**
 * Genera un digest SHA-256 puro sin requerir 'node:crypto' en entornos cliente/navegador.
 * @param {string} message
 * @returns {string}
 */
function sha256Pure(message) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  const result = '';

  const words = [];
  const asciiBitLength = message[lengthProperty] * 8;

  let hash = [];
  const k = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  hash = hash.slice(0, 8);

  message += '\x80';
  while ((message[lengthProperty] % 64) - 56) message += '\x00';
  for (i = 0; i < message[lengthProperty]; i++) {
    j = message.charCodeAt(i);
    if (j >> 8) return ''; // ASCII solo
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0);
      const temp2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  let hex = '';
  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      hex += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return hex;
}

/**
 * Genera un digest SHA-256 hexadecimal universal para Node y Browser.
 * @param {unknown} data
 * @returns {string}
 */
export function sha256(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data || '');
  return sha256Pure(text);
}
