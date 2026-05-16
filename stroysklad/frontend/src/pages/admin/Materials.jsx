import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance.js';

const UNITS = ['кг', 'т', 'м³', 'шт', 'п.м.', 'л'];

export default function MaterialsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Состояние модалки
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // null = создание, объект = редактирование
  const [form, setForm] = useState({ name: '', unit: 'кг', min_quantity: 0 });
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/materials');
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось загрузить материалы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', unit: 'кг', min_quantity: 0 });
    setModalError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name, unit: item.unit, min_quantity: item.min_quantity });
    setModalError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setModalError('');
    try {
      if (editing) {
        await api.put(`/materials/${editing.id}`, form);
      } else {
        await api.post('/materials', form);
      }
      closeModal();
      load();
    } catch (err) {
      setModalError(err.response?.data?.error || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Удалить материал «${item.name}»?`)) return;
    try {
      await api.delete(`/materials/${item.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Не удалось удалить');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Управление материалами</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          ➕ Добавить материал
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
                  <th>Наименование</th>
                  <th className="text-center">Ед. изм.</th>
                  <th className="text-end">Мин. остаток</th>
                  <th className="text-end" style={{ width: '200px' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      Материалов пока нет
                    </td>
                  </tr>
                )}
                {items.map(it => (
                  <tr key={it.id}>
                    <td><strong>{it.name}</strong></td>
                    <td className="text-center">{it.unit}</td>
                    <td className="text-end">{Number(it.min_quantity).toLocaleString('ru-RU')}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openEdit(it)}
                      >
                        Редактировать
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => remove(it)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модальное окно (управляемое через state, без Bootstrap-JS) */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show" onClick={closeModal} />
          <div className="modal fade show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog">
              <div className="modal-content">
                <form onSubmit={save}>
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editing ? 'Редактировать материал' : 'Добавить материал'}
                    </h5>
                    <button type="button" className="btn-close" onClick={closeModal} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Наименование *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Единица измерения *</label>
                      <select
                        className="form-select"
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        required
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Минимальный остаток</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        value={form.min_quantity}
                        onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                      />
                    </div>
                    {modalError && <div className="alert alert-danger">{modalError}</div>}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
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
