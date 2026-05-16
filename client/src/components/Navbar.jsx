import { Link, useLocation, useNavigate } from 'react-router-dom';
import { APP_LOGO, APP_TITLE } from '../constants.js';
import { clearToken, getUser } from '../api.js';
import { isAdmin, ROLE_LABELS } from '../utils/roles.js';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const admin = isAdmin(user);

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const linkClass = (path) =>
    `app-nav__link${location.pathname === path ? ' app-nav__link--active' : ''}`;

  return (
    <header className="app-nav">
      <div className="app-nav__inner">
        <Link to={admin ? '/admin/users' : '/'} className="app-nav__brand">
          <span className="app-nav__logo" aria-hidden="true">
            {APP_LOGO}
          </span>
          <span className="app-nav__title">{APP_TITLE}</span>
        </Link>

        <nav className="app-nav__links" aria-label="Основное меню">
          {admin ? (
            <>
              <Link className={linkClass('/admin/users')} to="/admin/users">
                Пользователи
              </Link>
              <Link className={linkClass('/admin/settings')} to="/admin/settings">
                Настройки
              </Link>
            </>
          ) : (
            <>
              <Link className={linkClass('/')} to="/">
                Остатки
              </Link>
              <Link className={linkClass('/operation')} to="/operation">
                Операции
              </Link>
              <Link className={linkClass('/reports')} to="/reports">
                Отчёты
              </Link>
            </>
          )}
        </nav>

        <div className="app-nav__right">
          {user && (
            <span className="app-nav__user">
              <strong>{user.login}</strong>
              {user.role ? ` · ${ROLE_LABELS[user.role] || user.role}` : ''}
            </span>
          )}
          <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
