import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { signJwt } from '../src/jwt/sign.js';
import { verifyJwt } from '../src/jwt/verify.js';
import { rotateRefreshToken } from '../src/jwt/refresh.js';

const SECRET = 'test-secret-do-not-use-in-prod';

describe('signJwt / verifyJwt', () => {
  it('roundtrips a payload', () => {
    const token = signJwt({ sub: 'user-1', role: 'user' }, SECRET, { expiresIn: '1h' });
    const result = verifyJwt(token, SECRET);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payload.sub).toBe('user-1');
      expect(result.payload.role).toBe('user');
      expect(typeof result.payload.iat).toBe('number');
      expect(typeof result.payload.exp).toBe('number');
    }
  });

  it('rejects an expired token', () => {
    const token = signJwt({ sub: 'user-1' }, SECRET, { expiresIn: '-1s' });
    const result = verifyJwt(token, SECRET);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('expired');
    }
  });

  it('rejects a tampered signature', () => {
    const token = signJwt({ sub: 'user-1' }, SECRET, { expiresIn: '1h' });
    const parts = token.split('.');
    // Corrupt the signature segment.
    const tampered = `${parts[0]}.${parts[1]}.${'A'.repeat(parts[2].length)}`;
    const result = verifyJwt(tampered, SECRET);
    expect(result.valid).toBe(false);
  });

  it('rejects a token signed with a different secret', () => {
    const token = signJwt({ sub: 'user-1' }, SECRET, { expiresIn: '1h' });
    const result = verifyJwt(token, 'other-secret');
    expect(result.valid).toBe(false);
  });

  it('rejects an alg=none downgrade', () => {
    // Manually craft an unsigned JWT to confirm the verifier won't accept it.
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
      'base64url'
    );
    const payload = Buffer.from(JSON.stringify({ sub: 'evil' })).toString(
      'base64url'
    );
    const token = `${header}.${payload}.`;
    const result = verifyJwt(token, SECRET);
    expect(result.valid).toBe(false);
  });
});

describe('rotateRefreshToken', () => {
  it('mints a new token preserving family and claims', () => {
    const original = signJwt(
      { sub: 'user-1', family: 'fam-abc', role: 'user' },
      SECRET,
      { expiresIn: '7d' }
    );
    const { newRefreshToken, payload } = rotateRefreshToken(original, SECRET, '7d');

    expect(newRefreshToken).not.toBe(original);
    expect(payload.family).toBe('fam-abc');
    expect(payload.sub).toBe('user-1');

    const verified = verifyJwt(newRefreshToken, SECRET);
    expect(verified.valid).toBe(true);
  });

  it('assigns a family if none is present', () => {
    const original = signJwt({ sub: 'user-1' }, SECRET, { expiresIn: '7d' });
    const { payload } = rotateRefreshToken(original, SECRET);
    expect(typeof payload.family).toBe('string');
    expect((payload.family as string).length).toBeGreaterThan(0);
  });

  it('throws when the current token is invalid', () => {
    expect(() => rotateRefreshToken('not-a-jwt', SECRET)).toThrow();
  });

  it('throws when the current token is expired', () => {
    const expired = jwt.sign({ sub: 'user-1' }, SECRET, { expiresIn: '-1s' });
    expect(() => rotateRefreshToken(expired, SECRET)).toThrow(/expired/);
  });
});
