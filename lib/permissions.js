export function isAdmin(role) {
  return role === 'admin';
}

export function isStaff(role) {
  return role === 'admin' || role === 'staff';
}

export function isPatient(role) {
  return role === 'patient';
}

export function dashboardForRole(role) {
  if (role === 'admin' || role === 'staff') return '/doctor';
  if (role === 'patient') return '/patient';
  return '/login';
}
