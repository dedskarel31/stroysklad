import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getToken, login, register } from '../api.js';

const ROLE_LABELS = {
  admin: 'Администратор',
  storekeeper: 'Кладовщик',
};

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ login: '', password: '', passwordConfirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (getToken()) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setForm({ login: '', password: '', passwordConfirm: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (mode === 'register' && form.password !== form.passwordConfirm) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.login, form.password);
      } else {
        await register(form.login, form.password);
      }
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
          <h3 className="mb-3">{mode === 'login' ? 'Вход в систему' : 'Регистрация'}</h3>

          <ul className="nav nav-pills nav-fill mb-4">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${mode === 'login' ? 'active' : ''}`}
                onClick={() => switchMode('login')}
              >
                Вход
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${mode === 'register' ? 'active' : ''}`}
                onClick={() => switchMode('register')}
              >
                Регистрация
              </button>
            </li>
          </ul>

          {mode === 'register' && (
            <p className="text-muted small mb-3">
              Новый аккаунт получает роль «{ROLE_LABELS.storekeeper}». Администратор создаётся при
              первичной настройке системы.
            </p>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Логин</label>
              <input
                className="form-control"
                name="login"
                value={form.login}
                onChange={handleChange}
                autoComplete="username"
                minLength={3}
                maxLength={100}
                pattern="[a-zA-Z0-9_]+"
                title="Латиница, цифры и символ _"
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
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
            </div>
            {mode === 'register' && (
              <div className="mb-3">
                <label className="form-label">Повтор пароля</label>
                <input
                  className="form-control"
                  type="password"
                  name="passwordConfirm"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            )}
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading
                ? mode === 'login'
                  ? 'Входим...'
                  : 'Регистрируем...'
                : mode === 'login'
                  ? 'Войти'
                  : 'Зарегистрироваться'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}