import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { getApiError } from '../api/axiosInstance.js';

const INSUFFICIENT = 'Недостаточно материала на складе';

export default function Operations() {
  const [searchParams] = useSearchParams();
  const [materials, setMaterials] = useState([]);
  const [stock, setStock] = useState([]);
  const [form, setForm] = useState({
    type: searchParams.get('type') === 'expense' ? 'expense' : 'income',
    material_id: '',
    quantity: '',
    comment: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/materials'), api.get('/stock')])
      .then(([m, s]) => {
        setMaterials(m.data);
        setStock(s.data);
      })
      .catch((e) => setError(getApiError(e)));
  }, []);

  const currentStock = stock.find((s) => String(s.material_id) === String(form.material_id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const payload = {
      material_id: Number(form.material_id),
      quantity: Number(form.quantity),
      comment: form.comment || undefined,
    };
    try {
      const path = form.type === 'income' ? '/transactions/income' : '/transactions/expense';
      await api.post(path, payload);
      setSuccess('Операция выполнена успешно');
      setForm((p) => ({ ...p, quantity: '', comment: '' }));
      const { data: newStock } = await api.get('/stock');
      setStock(newStock);
    } catch (err) {
      const msg = getApiError(err);
      if (msg.includes(INSUFFICIENT) && currentStock) {
        setError(`Недостаточно материала на складе. Доступно: ${currentStock.quantity} ${currentStock.unit}`);
      } else if (msg.includes(INSUFFICIENT)) {
        setError(`Недостаточно материала на складе. Доступно: 0`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="h3 mb-4">Регистрация операции</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Тип операции</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="income">Приход</option>
                <option value="expense">Расход</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Материал</label>
              <select
                className="form-select"
                value={form.material_id}
                onChange={(e) => setForm((p) => ({ ...p, material_id: e.target.value }))}
                required
              >
                <option value="">Выберите материал</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
              {form.type === 'expense' && form.material_id && currentStock && (
                <div className="form-text">
                  Текущий остаток: <strong>{currentStock.quantity}</strong> {currentStock.unit}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Количество</label>
              <input
                type="number"
                className="form-control"
                min="0.01"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Комментарий</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.comment}
                onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Выполнение...' : 'Выполнить операцию'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
