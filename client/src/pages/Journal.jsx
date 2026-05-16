import { useEffect, useState } from 'react';
import api, { getApiError } from '../api/axiosInstance.js';

const TYPE_LABELS = { income: 'Приход', expense: 'Расход' };

const emptyFilters = { type: '', date_from: '', date_to: '' };

export default function Journal() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (f = applied) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (f.type) params.type = f.type;
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to) params.date_to = f.date_to;
      const { data } = await api.get('/transactions', { params });
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

  const applyFilters = () => {
    setApplied(filters);
    load(filters);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setApplied(emptyFilters);
    load(emptyFilters);
  };

  return (
    <>
      <h1 className="h3 mb-4">Журнал операций</h1>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Тип операции</label>
              <select
                className="form-select"
                value={filters.type}
                onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
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
                onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Дата по</label>
              <input
                type="date"
                className="form-control"
                value={filters.date_to}
                onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))}
              />
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="button" className="btn btn-primary" onClick={applyFilters}>
                Применить
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={resetFilters}>
                Сбросить
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <p className="text-center py-5 text-muted mb-0">Загрузка...</p>
          ) : rows.length === 0 ? (
            <p className="text-center py-5 text-muted mb-0">Операций не найдено</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Дата и время</th>
                    <th>Материал</th>
                    <th>Ед. изм.</th>
                    <th>Тип</th>
                    <th>Количество</th>
                    <th>Комментарий</th>
                    <th>Сотрудник</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(row.created_at).toLocaleString('ru-RU')}</td>
                      <td>{row.material_name}</td>
                      <td>{row.unit}</td>
                      <td>
                        <span
                          className={`badge bg-${row.type === 'income' ? 'success' : 'danger'}`}
                        >
                          {TYPE_LABELS[row.type]}
                        </span>
                      </td>
                      <td>{row.quantity}</td>
                      <td>{row.comment || '—'}</td>
                      <td>{row.employee_full_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
