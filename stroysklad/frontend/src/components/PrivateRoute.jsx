// Защита маршрутов (соответствует листингу 3.4 диплома)
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
