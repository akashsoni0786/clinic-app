/**
 * @jest-environment node
 */
require('../../jest.setup.mongo');
const mongoose = require('mongoose');
const Patient = require('../../models/Patient').default;

describe('Patient model', () => {
  it('creates a patient record', async () => {
    const p = await Patient.create({
      name: 'Riya',
      contact_no: '9999999999',
      location: 'Delhi',
      createdBy: new mongoose.Types.ObjectId(),
    });
    expect(p._id).toBeDefined();
    expect(p.userId).toBeNull();
  });

  it('requires name, contact_no, location, createdBy', async () => {
    await expect(Patient.create({})).rejects.toThrow();
  });
});
