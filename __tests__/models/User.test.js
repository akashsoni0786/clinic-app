/**
 * @jest-environment node
 */
require('../../jest.setup.mongo');
const User = require('../../models/User').default;

beforeAll(async () => {
  // Force Mongoose to build indexes (including the unique email index)
  // before any test runs. Without this, the unique-index enforcement can
  // race against document inserts in mongodb-memory-server and the
  // duplicate-key error may never fire.
  await User.init();
});

describe('User model', () => {
  it('creates an admin user with required fields', async () => {
    const u = await User.create({
      role: 'admin',
      name: 'Akash',
      username: 'akash',
      email: 'a@example.com',
      phone: '9999999999',
      passwordHash: 'hash',
    });
    expect(u._id).toBeDefined();
    expect(u.role).toBe('admin');
    expect(u.emailVerified).toBe(false);
  });

  it('rejects a user with an unknown role', async () => {
    await expect(
      User.create({
        role: 'wizard',
        name: 'X',
        email: 'x@example.com',
        phone: '1',
        passwordHash: 'h',
      })
    ).rejects.toThrow();
  });

  it('enforces unique email', async () => {
    await User.create({
      role: 'staff',
      name: 'A',
      username: 'a',
      email: 'dup@example.com',
      phone: '1',
      passwordHash: 'h',
    });
    await expect(
      User.create({
        role: 'staff',
        name: 'B',
        username: 'b',
        email: 'dup@example.com',
        phone: '2',
        passwordHash: 'h',
      })
    ).rejects.toThrow();
  });

  it('allows multiple patient users without username', async () => {
    await User.create({
      role: 'patient',
      name: 'P1',
      email: 'p1@example.com',
      phone: '1',
      passwordHash: 'h',
    });
    await User.create({
      role: 'patient',
      name: 'P2',
      email: 'p2@example.com',
      phone: '2',
      passwordHash: 'h',
    });
    const count = await User.countDocuments({ role: 'patient' });
    expect(count).toBe(2);
  });
});
