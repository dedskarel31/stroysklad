import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { clearToken, fetchMe, getToken } from './api.js';
import Navbar from './components/Navbar.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import OperationPage from './pages/OperationPage.jsx';

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
        <div className="spinner" role="status" aria-label="Загрузка" />
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
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/operation"
        element={
          <ProtectedLayout>
            <OperationPage />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
