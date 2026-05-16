import { Link, useLocation, useNavigate } from 'react-router-dom';
import { APP_LOGO, APP_TITLE } from '../constants.js';
import { clearToken, getUser } from '../api.js';

const ROLE_LABELS = {
  admin: 'Администратор',
  storekeeper: 'Кладовщик',
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const linkClass = (path) =>
    `app-nav__link${location.pathname === path ? ' app-nav__link--active' : ''}`;

  return (
    <header className="app-nav">
      <div className="app-nav__inner">
        <Link to="/" className="app-nav__brand">
          <span className="app-nav__logo" aria-hidden="true">
            {APP_LOGO}
          </span>
          <span className="app-nav__title">{APP_TITLE}</span>
        </Link>

        <nav className="app-nav__links" aria-label="Основное меню">
          <Link className={linkClass('/')} to="/">
            Остатки
          </Link>
          <Link className={linkClass('/operation')} to="/operation">
            Новая операция
          </Link>
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
