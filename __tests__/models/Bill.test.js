/**
 * @jest-environment node
 */
require('../../jest.setup.mongo');
const mongoose = require('mongoose');
const Bill = require('../../models/Bill').default;

describe('Bill model', () => {
  beforeAll(() => Bill.init()); // force unique-index build

  it('creates a bill', async () => {
    const b = await Bill.create({
      billNumber: 'BILL-1',
      patientId: new mongoose.Types.ObjectId(),
      items: [{ description: 'Consultation', qty: 1, rate: 500, amount: 500 }],
      total: 500,
      generatedBy: new mongoose.Types.ObjectId(),
    });
    expect(b.billNumber).toBe('BILL-1');
    expect(b.total).toBe(500);
  });

  it('enforces unique billNumber', async () => {
    const base = {
      patientId: new mongoose.Types.ObjectId(),
      items: [],
      total: 0,
      generatedBy: new mongoose.Types.ObjectId(),
    };
    await Bill.create({ ...base, billNumber: 'DUP' });
    await expect(Bill.create({ ...base, billNumber: 'DUP' })).rejects.toThrow();
  });
});
