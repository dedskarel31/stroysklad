import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api, { getApiError } from '../api/axiosInstance.js';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (localStorage.getItem('token')) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('full_name', data.full_name || form.username);
      navigate('/dashboard');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm border-0" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div
              className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: 64, height: 64, fontSize: '1.5rem' }}
            >
              СС
            </div>
            <h1 className="h3 mb-1">СтройСклад</h1>
            <p className="text-muted small mb-0">
              ООО «Девелум ПГС», г. Белгород
              <br />
              Учёт строительных материалов
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                Логин
              </label>
              <input
                id="username"
                className="form-control"
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                autoComplete="username"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <p className="text-muted small mt-4 mb-0 text-center">
            Демо: admin / Admin123 · sklad1 / User123
          </p>
        </div>
      </div>
    </div>
  );
}
