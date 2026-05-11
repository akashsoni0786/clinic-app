/**
 * @jest-environment node
 */
require('../../jest.setup.mongo');
const { User } = require('../../models');
const { GET } = require('../../app/api/auth/first-run-status/route');

describe('GET /api/auth/first-run-status', () => {
  it('returns isFirstRun=true when no admin exists', async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.isFirstRun).toBe(true);
  });

  it('returns isFirstRun=false when an admin exists', async () => {
    await User.create({
      role: 'admin',
      name: 'A',
      username: 'a',
      email: 'a@e.com',
      phone: '1',
      passwordHash: 'h',
    });
    const res = await GET();
    const data = await res.json();
    expect(data.isFirstRun).toBe(false);
  });
});
