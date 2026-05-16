import { useEffect, useState } from 'react';
import api, { getApiError } from '../../api/axiosInstance.js';

const UNITS = ['кг', 'т', 'м³', 'шт', 'п.м.', 'л'];
const emptyForm = { name: '', unit: 'кг', min_quantity: 0 };

export default function AdminMaterials() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/materials');
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
    setEditId(null);
    setForm(emptyForm);
    setError('');
  };

  const openEdit = (m) => {
    setEditId(m.id);
    setForm({ name: m.name, unit: m.unit, min_quantity: m.min_quantity });
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await api.put(`/materials/${editId}`, form);
      } else {
        await api.post('/materials', form);
      }
      const el = document.getElementById('materialModal');
      if (window.bootstrap?.Modal) {
        window.bootstrap.Modal.getOrCreateInstance(el).hide();
      }
      await load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить материал?')) return;
    setError('');
    try {
      await api.delete(`/materials/${id}`);
      await load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Справочник материалов</h1>
        <button
          type="button"
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#materialModal"
          onClick={openCreate}
        >
          Добавить материал
        </button>
      </div>

      {error && !document.getElementById('materialModal')?.classList.contains('show') && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <p className="text-center py-5 text-muted">Загрузка...</p>
          ) : (
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Название</th>
                  <th>Ед. изм.</th>
                  <th>Мин. остаток</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.unit}</td>
                    <td>{m.min_quantity}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        data-bs-toggle="modal"
                        data-bs-target="#materialModal"
                        onClick={() => openEdit(m)}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(m.id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="modal fade" id="materialModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleSave}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {editId ? 'Редактировать материал' : 'Добавить материал'}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Закрыть" />
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <div className="mb-3">
                  <label className="form-label">Название *</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Единица измерения *</label>
                  <select
                    className="form-select"
                    value={form.unit}
                    onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
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
                    onChange={(e) => setForm((p) => ({ ...p, min_quantity: e.target.value }))}
                    required
                  />
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
