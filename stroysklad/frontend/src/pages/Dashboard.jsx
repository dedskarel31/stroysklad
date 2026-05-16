import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance.js';

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/stock');
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось загрузить остатки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deficitCount = rows.filter(r => r.is_deficit).length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Текущие остатки</h2>
          <div className="dashboard-counter">
            {deficitCount > 0 ? (
              <span className="badge bg-danger">
                ⚠ Дефицитных позиций: {deficitCount}
              </span>
            ) : (
              <span className="badge bg-success">Все позиции в норме</span>
            )}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link to="/operations" className="btn btn-success">
            ➕ Оформить приход
          </Link>
          <Link to="/operations" className="btn btn-warning">
            ➖ Оформить расход
          </Link>
          <button className="btn btn-outline-secondary" onClick={load}>
            🔄 Обновить
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка…</span>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Наименование</th>
                  <th className="text-center">Ед. изм.</th>
                  <th className="text-end">Остаток</th>
                  <th className="text-end">Мин. остаток</th>
                  <th className="text-center">Статус</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      Материалов нет. Добавьте через раздел «Администрирование».
                    </td>
                  </tr>
                )}
                {rows.map(r => (
                  <tr
                    key={r.material_id}
                    className={r.is_deficit ? 'deficit-row' : 'normal-row'}
                  >
                    <td><strong>{r.name}</strong></td>
                    <td className="text-center">{r.unit}</td>
                    <td className="text-end">{Number(r.quantity).toLocaleString('ru-RU')}</td>
                    <td className="text-end text-muted">{Number(r.min_quantity).toLocaleString('ru-RU')}</td>
                    <td className="text-center">
                      {r.is_deficit ? (
                        <span className="badge bg-danger">Дефицит</span>
                      ) : (
                        <span className="badge bg-success">В норме</span>
                      )}
                    </td>
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
