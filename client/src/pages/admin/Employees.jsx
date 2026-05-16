import { useEffect, useState } from 'react';
import api, { getApiError, getTokenUserId } from '../../api/axiosInstance.js';

const ROLE_LABELS = { admin: 'Администратор', user: 'Кладовщик' };
const emptyForm = { username: '', password: '', full_name: '', role: 'user' };

export default function AdminEmployees() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const currentId = getTokenUserId();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/employees');
      setRows(data);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/employees', form);
      const el = document.getElementById('employeeModal');
      if (window.bootstrap?.Modal) {
        window.bootstrap.Modal.getOrCreateInstance(el).hide();
      }
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить сотрудника?')) return;
    try {
      await api.delete(`/employees/${id}`);
      await load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Сотрудники</h1>
        <button
          type="button"
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#employeeModal"
          onClick={openCreate}
        >
          Добавить сотрудника
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <p className="text-center py-5 text-muted">Загрузка...</p>
          ) : (
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Логин</th>
                  <th>ФИО</th>
                  <th>Роль</th>
                  <th>Дата регистрации</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.full_name}</td>
                    <td>{ROLE_LABELS[u.role] || u.role}</td>
                    <td>{new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
                    <td>
                      {String(u.id) !== String(currentId) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(u.id)}
                        >
                          Удалить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="modal fade" id="employeeModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleSave}>
              <div className="modal-header">
                <h5 className="modal-title">Добавить сотрудника</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Закрыть" />
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <div className="mb-3">
                  <label className="form-label">Логин *</label>
                  <input
                    className="form-control"
                    value={form.username}
                    onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">ФИО *</label>
                  <input
                    className="form-control"
                    value={form.full_name}
                    onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Пароль *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    minLength={6}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Роль *</label>
                  <select
                    className="form-select"
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  >
                    <option value="user">Кладовщик</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
