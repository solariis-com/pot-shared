import { describe, expect, it } from 'vitest';
import { POTClient } from '../src/client';
import { DEFAULT_TIMEOUT } from '../src/config';

describe('POTClient', () => {
  it('instantiates with a valid config', () => {
    const client = new POTClient({ baseURL: 'https://api.test.po-t.app' });
    expect(client).toBeInstanceOf(POTClient);
    expect(client.config.baseURL).toBe('https://api.test.po-t.app');
  });

  it('throws when baseURL is missing', () => {
    expect(() => new POTClient({ baseURL: '' })).toThrowError(/baseURL is required/);
  });

  it('exposes the four module surfaces', () => {
    const client = new POTClient({ baseURL: 'https://api.test.po-t.app' });
    expect(client.auth).toBeDefined();
    expect(client.pote).toBeDefined();
    expect(client.transaction).toBeDefined();
    expect(client.admin).toBeDefined();
  });

  it('exposes typed methods on the pote module', () => {
    const client = new POTClient({ baseURL: 'https://api.test.po-t.app' });
    expect(typeof client.pote.list).toBe('function');
    expect(typeof client.pote.get).toBe('function');
    expect(typeof client.pote.create).toBe('function');
    expect(typeof client.pote.update).toBe('function');
    expect(typeof client.pote.archive).toBe('function');
    expect(typeof client.pote.join).toBe('function');
    expect(typeof client.pote.accept).toBe('function');
    expect(typeof client.pote.reject).toBe('function');
  });

  it('defaults timeout to DEFAULT_TIMEOUT when unset', () => {
    const client = new POTClient({ baseURL: 'https://api.test.po-t.app' });
    expect(client.http.defaults.timeout).toBe(DEFAULT_TIMEOUT);
  });

  it('honors an explicit timeout override', () => {
    const client = new POTClient({
      baseURL: 'https://api.test.po-t.app',
      timeout: 5000,
    });
    expect(client.http.defaults.timeout).toBe(5000);
  });

  it('exposes the underlying axios instance', () => {
    const client = new POTClient({ baseURL: 'https://api.test.po-t.app' });
    expect(client.http).toBeDefined();
    expect(typeof client.http.request).toBe('function');
  });
});
