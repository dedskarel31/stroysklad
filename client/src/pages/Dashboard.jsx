import { useEffect, useState } from 'react';
import { APP_TAGLINE } from '../constants.js';
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
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Текущие остатки</h1>
          <p className="page-header__subtitle">{APP_TAGLINE}</p>
        </div>
        <button type="button" className="btn btn--outline btn--sm" onClick={loadData} disabled={loading}>
          Обновить
        </button>
      </header>

      {error && <div className="alert alert--danger">{error}</div>}

      <section className="panel panel--padded">
        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto 1rem' }} aria-hidden="true" />
            <p className="text-muted">Загрузка остатков...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state">Нет данных по остаткам</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
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
                    <tr
                      key={row.balance_id}
                      className={low ? 'data-table__row--low' : undefined}
                    >
                      <td>{row.name}</td>
                      <td>{row.article || '—'}</td>
                      <td>{row.unit}</td>
                      <td>{row.min_quantity}</td>
                      <td>{row.quantity}</td>
                      <td>
                        <span className={`badge ${low ? 'badge--danger' : 'badge--success'}`}>
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
      </section>
    </>
  );
}
