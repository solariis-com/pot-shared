import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { PiiCiphertext } from '../types.js';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32; // 256 bits
const IV_BYTES = 12; // 96 bits — recommended for GCM
const AUTH_TAG_BYTES = 16;

/**
 * Encrypt a PII string with AES-256-GCM.
 *
 * Returns base64-encoded `ciphertext`, fresh random `iv`, and `authTag`.
 * Persist all three columns — decryption requires every byte.
 *
 * SECURITY: a fresh IV per call is mandatory for GCM. Reusing an IV with the
 * same key catastrophically breaks confidentiality and integrity.
 */
export function encryptPii(plaintext: string, masterKey: Buffer): PiiCiphertext {
  if (!Buffer.isBuffer(masterKey) || masterKey.length !== KEY_BYTES) {
    throw new Error(
      `encryptPii: masterKey must be a ${KEY_BYTES}-byte Buffer (got ${
        Buffer.isBuffer(masterKey) ? masterKey.length : typeof masterKey
      })`
    );
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, masterKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Decrypt an AES-256-GCM PII bundle.
 *
 * SECURITY: `decipher.final()` throws if the authTag doesn't match — this is
 * the integrity check that distinguishes GCM from CBC. Caller should treat
 * any thrown error as "tamper detected" and refuse the row.
 */
export function decryptPii(
  ciphertext: string,
  iv: string,
  authTag: string,
  masterKey: Buffer
): string {
  if (!Buffer.isBuffer(masterKey) || masterKey.length !== KEY_BYTES) {
    throw new Error(
      `decryptPii: masterKey must be a ${KEY_BYTES}-byte Buffer (got ${
        Buffer.isBuffer(masterKey) ? masterKey.length : typeof masterKey
      })`
    );
  }

  const ivBuf = Buffer.from(iv, 'base64');
  const tagBuf = Buffer.from(authTag, 'base64');
  const ctBuf = Buffer.from(ciphertext, 'base64');

  if (ivBuf.length !== IV_BYTES) {
    throw new Error(`decryptPii: iv must decode to ${IV_BYTES} bytes`);
  }
  if (tagBuf.length !== AUTH_TAG_BYTES) {
    throw new Error(`decryptPii: authTag must decode to ${AUTH_TAG_BYTES} bytes`);
  }

  const decipher = createDecipheriv(ALGORITHM, masterKey, ivBuf);
  decipher.setAuthTag(tagBuf);

  const plaintext = Buffer.concat([decipher.update(ctBuf), decipher.final()]);
  return plaintext.toString('utf8');
}
