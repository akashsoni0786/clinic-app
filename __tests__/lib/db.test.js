/**
 * @jest-environment node
 */
require('../../jest.setup.mongo'); // registers beforeAll/afterAll that set MONGODB_URI
const connectToDatabase = require('../../lib/db').default;

describe('connectToDatabase', () => {
  it('returns a connected mongoose instance', async () => {
    const conn = await connectToDatabase();
    expect(conn.connection.readyState).toBe(1); // 1 = connected
  });

  it('reuses the cached connection on subsequent calls', async () => {
    const a = await connectToDatabase();
    const b = await connectToDatabase();
    expect(a).toBe(b);
  });
});
