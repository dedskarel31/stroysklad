import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { clearToken, fetchMe, getToken, getUser } from './api.js';
import RequireRole from './components/RequireRole.jsx';
import Navbar from './components/Navbar.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AdminSettingsPage from './pages/AdminSettingsPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import OperationPage from './pages/OperationPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import { homePathForRole, ROLES } from './utils/roles.js';

function HomeRedirect() {
  const user = getUser();
  return <Navigate to={homePathForRole(user?.role)} replace />;
}

function ProtectedLayout({ children }) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const token = getToken();

  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }

    fetchMe()
      .catch(() => {
        clearToken();
        navigate('/login', { replace: true });
      })
      .finally(() => setReady(true));
  }, [token, navigate]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!ready) {
    return (
      <div className="app-loading">
        <div className="spinner" role="status" aria-label="03@C7:0" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />

      <Route
        path="/"
        element={
          <ProtectedLayout>
            <RequireRole roles={[ROLES.STOREKEEPER]}>
              <Dashboard />
            </RequireRole>
          </ProtectedLayout>
        }
      />
      <Route
        path="/operation"
        element={
          <ProtectedLayout>
            <RequireRole roles={[ROLES.STOREKEEPER]}>
              <OperationPage />
            </RequireRole>
          </ProtectedLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedLayout>
            <RequireRole roles={[ROLES.STOREKEEPER]}>
              <ReportsPage />
            </RequireRole>
          </ProtectedLayout>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedLayout>
            <RequireRole roles={[ROLES.ADMIN]}>
              <AdminUsersPage />
            </RequireRole>
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedLayout>
            <RequireRole roles={[ROLES.ADMIN]}>
              <AdminSettingsPage />
            </RequireRole>
          </ProtectedLayout>
        }
      />

      <Route
        path="*"
        element={
          <ProtectedLayout>
            <HomeRedirect />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}
