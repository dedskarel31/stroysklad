import { useEffect, useState } from 'react';
import { fetchStock } from '../api.js';

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await fetchStock();
      setRows(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Текущие остатки</h2>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={loadData}>
          Обновить
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Материал</th>
                <th>Артикул</th>
                <th>Ед.</th>
                <th>Минимум</th>
                <th>Остаток</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const low = Number(row.quantity) < Number(row.min_quantity);
                return (
                  <tr key={row.balance_id} className={low ? 'table-danger' : ''}>
                    <td>{row.name}</td>
                    <td>{row.article || '-'}</td>
                    <td>{row.unit}</td>
                    <td>{row.min_quantity}</td>
                    <td>{row.quantity}</td>
                    <td>
                      <span className={`badge ${low ? 'text-bg-danger' : 'text-bg-success'}`}>
                        {low ? 'Ниже минимума' : 'Норма'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
