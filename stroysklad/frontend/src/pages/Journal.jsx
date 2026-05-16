import { useEffect, useState } from 'react';
import api from '../api/axiosInstance.js';

export default function Journal() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ type: '', date_from: '', date_to: '' });

  const load = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/transactions', { params });
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось загрузить журнал');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const apply = () => {
    const params = {};
    if (filters.type) params.type = filters.type;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    load(params);
  };

  const reset = () => {
    setFilters({ type: '', date_from: '', date_to: '' });
    load();
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div>
      <h2 className="mb-4">Журнал операций</h2>

      {/* Фильтры */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Тип операции</label>
              <select
                className="form-select"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">Все</option>
                <option value="income">Приход</option>
                <option value="expense">Расход</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Дата с</label>
              <input
                type="date"
                className="form-control"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Дата по</label>
              <input
                type="date"
                className="form-control"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button className="btn btn-primary flex-fill" onClick={apply}>
                Применить
              </button>
              <button className="btn btn-outline-secondary" onClick={reset}>
                Сбросить
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка…</span>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="alert alert-info text-center">Операций не найдено</div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Дата и время</th>
                  <th>Материал</th>
                  <th className="text-center">Ед. изм.</th>
                  <th className="text-center">Тип</th>
                  <th className="text-end">Количество</th>
                  <th>Комментарий</th>
                  <th>Сотрудник</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td><small>{formatDate(r.created_at)}</small></td>
                    <td>{r.material_name}</td>
                    <td className="text-center">{r.unit}</td>
                    <td className="text-center">
                      {r.type === 'income' ? (
                        <span className="badge bg-success">Приход</span>
                      ) : (
                        <span className="badge bg-danger">Расход</span>
                      )}
                    </td>
                    <td className="text-end fw-semibold">
                      {Number(r.quantity).toLocaleString('ru-RU')}
                    </td>
                    <td><small className="text-muted">{r.comment || '—'}</small></td>
                    <td><small>{r.employee_full_name}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
