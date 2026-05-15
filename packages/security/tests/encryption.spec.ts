import { describe, it, expect } from 'vitest';
import { randomBytes } from 'node:crypto';
import { encryptPii, decryptPii } from '../src/encryption/pii.js';
import { PII_FIELDS, isPiiField } from '../src/encryption/pii-types.js';

describe('encryptPii / decryptPii', () => {
  const key = randomBytes(32);

  it('roundtrips a plaintext string', () => {
    const plaintext = 'V-12345678';
    const { ciphertext, iv, authTag } = encryptPii(plaintext, key);

    expect(ciphertext).toBeTypeOf('string');
    expect(iv).toBeTypeOf('string');
    expect(authTag).toBeTypeOf('string');
    expect(ciphertext).not.toContain(plaintext);

    const decrypted = decryptPii(ciphertext, iv, authTag, key);
    expect(decrypted).toBe(plaintext);
  });

  it('produces a fresh IV per call (no IV reuse)', () => {
    const a = encryptPii('same-plaintext', key);
    const b = encryptPii('same-plaintext', key);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('fails authTag check on tampered ciphertext', () => {
    const { ciphertext, iv, authTag } = encryptPii('secret-pii', key);
    // Flip a byte inside the ciphertext.
    const ctBuf = Buffer.from(ciphertext, 'base64');
    ctBuf[0] = ctBuf[0] ^ 0xff;
    const tampered = ctBuf.toString('base64');

    expect(() => decryptPii(tampered, iv, authTag, key)).toThrow();
  });

  it('fails authTag check on tampered authTag', () => {
    const { ciphertext, iv, authTag } = encryptPii('secret-pii', key);
    const tagBuf = Buffer.from(authTag, 'base64');
    tagBuf[0] = tagBuf[0] ^ 0xff;
    const tampered = tagBuf.toString('base64');

    expect(() => decryptPii(ciphertext, iv, tampered, key)).toThrow();
  });

  it('fails when decrypting with a different key', () => {
    const { ciphertext, iv, authTag } = encryptPii('secret-pii', key);
    const otherKey = randomBytes(32);
    expect(() => decryptPii(ciphertext, iv, authTag, otherKey)).toThrow();
  });

  it('rejects non-32-byte master keys', () => {
    const shortKey = randomBytes(16);
    expect(() => encryptPii('x', shortKey)).toThrow(/32-byte/);
    expect(() => decryptPii('AAAA', 'AAAA', 'AAAA', shortKey)).toThrow(/32-byte/);
  });
});

describe('PII_FIELDS', () => {
  it('contains the canonical four fields', () => {
    expect(PII_FIELDS).toEqual(['phone', 'cedula', 'bankAccount', 'rif']);
  });

  it('isPiiField narrows correctly', () => {
    expect(isPiiField('phone')).toBe(true);
    expect(isPiiField('cedula')).toBe(true);
    expect(isPiiField('email')).toBe(false);
    expect(isPiiField('')).toBe(false);
  });
});
