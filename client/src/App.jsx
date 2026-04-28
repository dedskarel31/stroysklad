import { Navigate, Route, Routes } from 'react-router-dom';
import { getToken } from './api.js';
import Navbar from './components/Navbar.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import OperationPage from './pages/OperationPage.jsx';

function ProtectedLayout({ children }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Navbar />
      {children}
    </>
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
