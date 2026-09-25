import { describe, expect, it } from 'vitest';

import { namePetRequestSchema, petActionRequestSchema } from './requests.js';

describe('namePetRequestSchema', () => {
  it('normalizes whitespace', () => {
    expect(namePetRequestSchema.parse({ name: '  Momo \n Kecil ' })).toEqual({ name: 'Momo Kecil' });
  });

  it.each(['', '   ', 'x'.repeat(31), '\u200B\u200B', '\uFEFF '])('rejects %j', (name) => {
    expect(namePetRequestSchema.safeParse({ name }).success).toBe(false);
  });

  it('accepts international names up to 30 characters', () => {
    expect(namePetRequestSchema.parse({ name: 'もも' }).name).toBe('もも');
    expect(namePetRequestSchema.parse({ name: 'x'.repeat(30) }).name).toHaveLength(30);
  });
});

describe('petActionRequestSchema', () => {
  it('only accepts Prototype 0.1 care actions', () => {
    expect(petActionRequestSchema.safeParse({ type: 'FEED' }).success).toBe(true);
    expect(petActionRequestSchema.safeParse({ type: 'TALK' }).success).toBe(false);
  });
});
