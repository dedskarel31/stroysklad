import { Navigate } from 'react-router-dom';
import { getUser } from '../api.js';
import { homePathForRole } from '../utils/roles.js';

export default function RequireRole({ roles, children }) {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return children;
}
