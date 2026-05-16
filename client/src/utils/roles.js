export const ROLES = {
  ADMIN: 'admin',
  STOREKEEPER: 'storekeeper',
};

export const ROLE_LABELS = {
  admin: 'Администратор',
  storekeeper: 'Кладовщик',
};

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}

export function isStorekeeper(user) {
  return user?.role === ROLES.STOREKEEPER;
}

export function homePathForRole(role) {
  return role === ROLES.ADMIN ? '/admin/users' : '/';
}
