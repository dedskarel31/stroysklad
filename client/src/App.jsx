import { Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Operations from './pages/Operations.jsx';
import Journal from './pages/Journal.jsx';
import AdminMaterials from './pages/admin/Materials.jsx';
import AdminEmployees from './pages/admin/Employees.jsx';

function ProtectedPage({ children, adminOnly = false }) {
  return (
    <PrivateRoute adminOnly={adminOnly}>
      <AppLayout>{children}</AppLayout>
    </PrivateRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedPage>
            <Dashboard />
          </ProtectedPage>
        }
      />
      <Route
        path="/operations"
        element={
          <ProtectedPage>
            <Operations />
          </ProtectedPage>
        }
      />
      <Route
        path="/journal"
        element={
          <ProtectedPage>
            <Journal />
          </ProtectedPage>
        }
      />
      <Route
        path="/admin/materials"
        element={
          <ProtectedPage adminOnly>
            <AdminMaterials />
          </ProtectedPage>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <ProtectedPage adminOnly>
            <AdminEmployees />
          </ProtectedPage>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
