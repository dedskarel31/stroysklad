import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearToken } from '../api.js';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

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
        <button type="button" className="btn btn-outline-light btn-sm" onClick={handleLogout}>
          Выйти
        </button>
      </div>
    </nav>
  );
}
