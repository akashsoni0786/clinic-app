const { isStaff, isAdmin, isPatient, dashboardForRole } = require('../../lib/permissions');

describe('permissions', () => {
  it('isStaff returns true for admin and staff, false otherwise', () => {
    expect(isStaff('admin')).toBe(true);
    expect(isStaff('staff')).toBe(true);
    expect(isStaff('patient')).toBe(false);
    expect(isStaff(undefined)).toBe(false);
  });

  it('isAdmin only true for admin', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('staff')).toBe(false);
    expect(isAdmin('patient')).toBe(false);
  });

  it('isPatient only true for patient', () => {
    expect(isPatient('patient')).toBe(true);
    expect(isPatient('admin')).toBe(false);
  });

  it('dashboardForRole returns correct path', () => {
    expect(dashboardForRole('admin')).toBe('/doctor');
    expect(dashboardForRole('staff')).toBe('/doctor');
    expect(dashboardForRole('patient')).toBe('/patient');
    expect(dashboardForRole(undefined)).toBe('/login');
  });
});
