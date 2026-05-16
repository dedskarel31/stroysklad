import { Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from './components/PrivateRoute.jsx';
import Navbar from './components/Navbar.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Operations from './pages/Operations.jsx';
import Journal from './pages/Journal.jsx';
import MaterialsAdmin from './pages/admin/Materials.jsx';
import EmployeesAdmin from './pages/admin/Employees.jsx';

function ProtectedLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="container page-container">{children}</div>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <ProtectedLayout><Dashboard /></ProtectedLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/operations"
        element={
          <PrivateRoute>
            <ProtectedLayout><Operations /></ProtectedLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/journal"
        element={
          <PrivateRoute>
            <ProtectedLayout><Journal /></ProtectedLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/materials"
        element={
          <PrivateRoute adminOnly>
            <ProtectedLayout><MaterialsAdmin /></ProtectedLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <PrivateRoute adminOnly>
            <ProtectedLayout><EmployeesAdmin /></ProtectedLayout>
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
