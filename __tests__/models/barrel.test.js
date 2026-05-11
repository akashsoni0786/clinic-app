/**
 * @jest-environment node
 */
const models = require('../../models');

describe('models barrel', () => {
  it('exports all expected models', () => {
    expect(models.User).toBeDefined();
    expect(models.Patient).toBeDefined();
    expect(models.Appointment).toBeDefined();
    expect(models.Bill).toBeDefined();
    expect(models.ClinicSettings).toBeDefined();
    expect(models.CustomSuggestions).toBeDefined();
    expect(models.OtpToken).toBeDefined();
  });
});
