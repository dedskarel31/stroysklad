import { useEffect, useState } from 'react';
import { fetchAdminUsers, updateUserRole } from '../api.js';
import { getUser } from '../api.js';
import { ROLE_LABELS } from '../utils/roles.js';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const currentUser = getUser();

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      setUsers(await fetchAdminUsers());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRoleChange = async (userId, role) => {
    setSavingId(userId);
    setError('');
    try {
      await updateUserRole(userId, role);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Пользователи</h1>
          <p className="page-header__subtitle">Информация о пользователях системы</p>
        </div>
      </header>

      {error && <div className="alert alert--danger">{error}</div>}

      <section className="panel panel--padded">
        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto 1rem' }} aria-hidden="true" />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Логин</th>
                  <th>Роль</th>
                  <th>Изменить роль</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.login}
                      {currentUser?.id === u.id ? ' (вы)' : ''}
                    </td>
                    <td>{ROLE_LABELS[u.role] || u.role}</td>
                    <td>
                      <select
                        className="form-field__select"
                        value={u.role}
                        disabled={savingId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="storekeeper">Кладовщик</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
