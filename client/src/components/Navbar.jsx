import { Link, useLocation, useNavigate } from 'react-router-dom';
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

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <span className="navbar-brand">СтройСклад</span>
        <div className="navbar-nav me-auto">
          <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">
            Остатки
          </Link>
          <Link
            className={`nav-link ${location.pathname === '/operation' ? 'active' : ''}`}
            to="/operation"
          >
            Новая операция
          </Link>
        </div>
        {user && (
          <span className="navbar-text text-white-50 me-3 small">
            {user.login}
            {user.role && ` · ${ROLE_LABELS[user.role] || user.role}`}
          </span>
        )}
        <button type="button" className="btn btn-outline-light btn-sm" onClick={handleLogout}>
          Выйти
        </button>
      </div>
    </nav>
  );
}
