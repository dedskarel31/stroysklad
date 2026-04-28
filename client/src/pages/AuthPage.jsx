import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setToken } from '../api.js';

export default function AuthPage({ onLoginSuccess }) {
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(form.login, form.password);
      setToken(result.token);
      onLoginSuccess?.();
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-wrap">
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h3 className="mb-3">Вход в систему</h3>
          <p className="text-muted small mb-4">Тестовый админ: admin / admin123</p>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Логин</label>
              <input
                className="form-control"
                name="login"
                value={form.login}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Пароль</label>
              <input
                className="form-control"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
