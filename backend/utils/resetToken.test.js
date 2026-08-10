import { describe, it, expect } from 'vitest';
import { hashResetToken } from './resetToken.js';

describe('hashResetToken', () => {
  it('é determinístico: o mesmo token sempre gera o mesmo hash', () => {
    const token = 'a'.repeat(64);
    expect(hashResetToken(token)).toBe(hashResetToken(token));
  });

  it('tokens diferentes geram hashes diferentes', () => {
    expect(hashResetToken('token-um')).not.toBe(hashResetToken('token-dois'));
  });

  it('nunca retorna o token original (não é um no-op)', () => {
    const token = 'meu-token-secreto';
    expect(hashResetToken(token)).not.toBe(token);
  });

  it('produz um hex de 64 caracteres (sha256)', () => {
    expect(hashResetToken('qualquer-coisa')).toMatch(/^[0-9a-f]{64}$/);
  });
});
