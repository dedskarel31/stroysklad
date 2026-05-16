import { Link, NavLink, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('full_name') || localStorage.getItem('username') || '';
  const isAdmin = role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('full_name');
    localStorage.removeItem('username');
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    isActive ? 'nav-link active fw-semibold' : 'nav-link';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand app-brand" to="/dashboard">
          📦 СтройСклад
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Меню"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink to="/dashboard" className={navLinkClass}>Главная</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/operations" className={navLinkClass}>Операции</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/journal" className={navLinkClass}>Журнал</NavLink>
            </li>

            {isAdmin && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Администрирование
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/admin/materials">Материалы</Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/admin/employees">Сотрудники</Link>
                  </li>
                </ul>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center text-white">
            <span className="me-3">
              <small>{isAdmin ? '👤 Администратор' : '🛠 Кладовщик'}:</small>{' '}
              <strong>{fullName}</strong>
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
