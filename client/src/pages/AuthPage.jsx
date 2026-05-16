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
    <div className="auth-screen">
      <div className="auth-screen__glow auth-screen__glow--left" aria-hidden="true" />
      <div className="auth-screen__glow auth-screen__glow--right" aria-hidden="true" />

      <div className="auth-card">
        <header className="auth-card__header">
          <div className="auth-card__logo" aria-hidden="true">
            СС
          </div>
          <div>
            <p className="auth-card__brand">СтройСклад</p>
            <h1 className="auth-card__title">
              {mode === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
            </h1>
          </div>
        </header>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tabs__btn ${mode === 'login' ? 'auth-tabs__btn--active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tabs__btn ${mode === 'register' ? 'auth-tabs__btn--active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Регистрация
          </button>
        </div>

        {mode === 'register' && (
          <p className="auth-card__hint">
            Новый пользователь получает роль «{ROLE_LABELS.storekeeper}». Администратор создаётся при
            первичной настройке системы.
          </p>
        )}

        {error && (
          <div className="auth-alert" role="alert">
            <span className="auth-alert__icon" aria-hidden="true">
              !
            </span>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-field__label" htmlFor="auth-login">
              Логин
            </label>
            <input
              id="auth-login"
              className="auth-field__input"
              name="login"
              value={form.login}
              onChange={handleChange}
              autoComplete="username"
              placeholder="например, ivanov"
              minLength={3}
              maxLength={100}
              pattern="[a-zA-Z0-9_]+"
              title="Латиница, цифры и символ _"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="auth-password">
              Пароль
            </label>
            <input
              id="auth-password"
              className="auth-field__input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="не менее 6 символов"
              minLength={6}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="auth-field">
              <label className="auth-field__label" htmlFor="auth-password-confirm">
                Повтор пароля
              </label>
              <input
                id="auth-password-confirm"
                className="auth-field__input"
                type="password"
                name="passwordConfirm"
                value={form.passwordConfirm}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="ещё раз"
                minLength={6}
                required
              />
            </div>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? <span className="auth-submit__spinner" aria-hidden="true" /> : null}
            <span>
              {loading
                ? mode === 'login'
                  ? 'Входим...'
                  : 'Регистрируем...'
                : mode === 'login'
                  ? 'Войти'
                  : 'Зарегистрироваться'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
