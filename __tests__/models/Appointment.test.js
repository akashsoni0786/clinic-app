/**
 * @jest-environment node
 */
require('../../jest.setup.mongo');
const Appointment = require('../../models/Appointment').default;

describe('Appointment model', () => {
  it('creates a guest-requested appointment', async () => {
    const a = await Appointment.create({
      status: 'requested',
      requesterContact: { name: 'X', phone: '999', email: 'x@e.com' },
      reason: 'Checkup',
      createdBy: 'public',
    });
    expect(a.patientId).toBeNull();
    expect(a.status).toBe('requested');
  });

  it('rejects an unknown status', async () => {
    await expect(
      Appointment.create({
        status: 'maybe',
        reason: 'x',
        createdBy: 'public',
        requesterContact: { name: 'a', phone: '1', email: 'a@e.com' },
      })
    ).rejects.toThrow();
  });
});
