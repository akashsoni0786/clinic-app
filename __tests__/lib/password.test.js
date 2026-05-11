const { hashPassword, verifyPassword } = require('../../lib/password');

describe('password helpers', () => {
  it('hashes a password to a non-empty string different from the input', async () => {
    const hash = await hashPassword('secret123');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(20);
    expect(hash).not.toBe('secret123');
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('secret123');
    await expect(verifyPassword('secret123', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('secret123');
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });
});
