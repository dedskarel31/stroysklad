import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getApiError } from '../api/axiosInstance.js';

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
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deficitCount = rows.filter((r) => r.is_deficit).length;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h3 mb-1">Текущие остатки</h1>
          <p className="text-muted mb-0">Склад строительных материалов — ООО «Девелум ПГС»</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {deficitCount > 0 && (
            <span className="badge bg-danger fs-6">Дефицитных позиций: {deficitCount}</span>
          )}
          <Link to="/operations?type=income" className="btn btn-success btn-sm">
            Оформить приход
          </Link>
          <Link to="/operations?type=expense" className="btn btn-outline-danger btn-sm">
            Оформить расход
          </Link>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load}>
            Обновить
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <p className="text-center py-5 text-muted mb-0">Загрузка...</p>
          ) : rows.length === 0 ? (
            <p className="text-center py-5 text-muted mb-0">Нет данных по остаткам</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Наименование</th>
                    <th>Ед. изм.</th>
                    <th>Остаток</th>
                    <th>Мин. остаток</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.material_id}
                      className={row.is_deficit ? 'table-danger' : 'table-success'}
                    >
                      <td>{row.name}</td>
                      <td>{row.unit}</td>
                      <td>{row.quantity}</td>
                      <td>{row.min_quantity}</td>
                      <td>
                        {row.is_deficit ? (
                          <span className="badge bg-danger">Дефицит</span>
                        ) : (
                          <span className="badge bg-success">Норма</span>
                        )}
                      </td>
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
