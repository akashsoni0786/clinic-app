/**
 * @jest-environment node
 */
require('../../jest.setup.mongo');
const { User } = require('../../models');
const { POST } = require('../../app/api/auth/first-run/route');

function makeReq(body) {
  return { json: async () => body };
}

describe('POST /api/auth/first-run', () => {
  it('creates the first admin user', async () => {
    const res = await POST(
      makeReq({
        name: 'Akash',
        username: 'akash',
        email: 'a@e.com',
        phone: '1234567890',
        password: 'secret123',
      })
    );
    const data = await res.json();
    expect(data.success).toBe(true);
    const u = await User.findOne({ username: 'akash' });
    expect(u.role).toBe('admin');
    expect(u.passwordHash).not.toBe('secret123');
  });

  it('refuses if an admin already exists', async () => {
    await User.create({
      role: 'admin',
      name: 'A',
      username: 'a',
      email: 'a@e.com',
      phone: '1',
      passwordHash: 'h',
    });
    const res = await POST(
      makeReq({
        name: 'B',
        username: 'b',
        email: 'b@e.com',
        phone: '2',
        password: 'pw',
      })
    );
    expect(res.status).toBe(403);
  });

  it('rejects missing fields', async () => {
    const res = await POST(makeReq({ name: 'X' }));
    expect(res.status).toBe(400);
  });
});
