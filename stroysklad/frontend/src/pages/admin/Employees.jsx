import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance.js';

const ROLE_LABEL = { admin: 'Администратор', user: 'Кладовщик' };

export default function EmployeesAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'user' });
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // username текущего пользователя — чтобы не показать ему кнопку «Удалить» на самом себе
  const currentUsername = localStorage.getItem('username');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/employees');
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось загрузить сотрудников');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ username: '', password: '', full_name: '', role: 'user' });
    setModalError('');
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setModalError('');
    try {
      await api.post('/employees', form);
      setShowModal(false);
      load();
    } catch (err) {
      setModalError(err.response?.data?.error || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Удалить сотрудника «${item.username}»?`)) return;
    try {
      await api.delete(`/employees/${item.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Не удалось удалить');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('ru-RU');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Управление сотрудниками</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          ➕ Добавить сотрудника
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Логин</th>
                  <th>ФИО</th>
                  <th>Роль</th>
                  <th>Дата регистрации</th>
                  <th className="text-end" style={{ width: '160px' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.map(u => (
                  <tr key={u.id}>
                    <td><code>{u.username}</code></td>
                    <td>{u.full_name || '—'}</td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className="badge bg-primary">{ROLE_LABEL[u.role]}</span>
                      ) : (
                        <span className="badge bg-secondary">{ROLE_LABEL[u.role]}</span>
                      )}
                    </td>
                    <td><small>{formatDate(u.created_at)}</small></td>
                    <td className="text-end">
                      {u.username !== currentUsername && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => remove(u)}
                        >
                          Удалить
                        </button>
                      )}
                      {u.username === currentUsername && (
                        <small className="text-muted">это вы</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setShowModal(false)} />
          <div className="modal fade show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog">
              <div className="modal-content">
                <form onSubmit={save}>
                  <div className="modal-header">
                    <h5 className="modal-title">Добавить сотрудника</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Логин *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">ФИО</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        placeholder="Иванов Иван Иванович"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Пароль *</label>
                      <input
                        type="password"
                        className="form-control"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        minLength="6"
                        autoComplete="new-password"
                        required
                      />
                      <div className="form-text">Минимум 6 символов</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Роль *</label>
                      <select
                        className="form-select"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                      >
                        <option value="user">Кладовщик</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </div>
                    {modalError && <div className="alert alert-danger">{modalError}</div>}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Отмена
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Сохранение…' : 'Сохранить'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
