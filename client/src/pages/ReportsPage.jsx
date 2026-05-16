import { useEffect, useState } from 'react';
import { fetchOperations } from '../api.js';

const TYPE_LABELS = {
  income: 'Поступление',
  expense: 'Выдача',
};

export default function ReportsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setError('');
      setLoading(true);
      try {
        const data = await fetchOperations();
        setRows(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Отчёты о движении материалов</h1>
          <p className="page-header__subtitle">Журнал прихода и выдачи со склада</p>
        </div>
      </header>

      {error && <div className="alert alert--danger">{error}</div>}

      <section className="panel panel--padded">
        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto 1rem' }} aria-hidden="true" />
            <p className="text-muted">Загрузка журнала...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state">Операций пока нет</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Тип</th>
                  <th>Материал</th>
                  <th>Артикул</th>
                  <th>Кол-во</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.date).toLocaleString('ru-RU')}</td>
                    <td>
                      <span
                        className={`badge ${row.type === 'income' ? 'badge--success' : 'badge--danger'}`}
                      >
                        {TYPE_LABELS[row.type] || row.type}
                      </span>
                    </td>
                    <td>
                      {row.material_name} ({row.unit})
                    </td>
                    <td>{row.article}</td>
                    <td>{row.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
