import { useEffect, useState } from 'react';
import { createOperation, fetchMaterials } from '../api.js';

const INSUFFICIENT_STOCK_MESSAGE = 'Недостаточно материала на складе';

export default function OperationPage() {
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({
    type: 'income',
    material_id: '',
    quantity: '',
  });
  const [error, setError] = useState('');
  const [insufficientError, setInsufficientError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMaterials() {
      try {
        const data = await fetchMaterials();
        setMaterials(data);
      } catch (e) {
        setError(e.message);
      }
    }
    loadMaterials();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setInsufficientError('');
    setSuccess('');
    setLoading(true);
    try {
      await createOperation({
        type: form.type,
        material_id: Number(form.material_id),
        quantity: Number(form.quantity),
      });
      setSuccess('Операция успешно добавлена');
      setForm((prev) => ({ ...prev, quantity: '' }));
    } catch (e) {
      if (e.message?.includes(INSUFFICIENT_STOCK_MESSAGE)) {
        setInsufficientError(INSUFFICIENT_STOCK_MESSAGE);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2 className="h4 mb-3">Новая операция</h2>

      {insufficientError && (
        <div className="alert alert-danger border-2 shadow-sm" role="alert">
          <div className="fw-semibold mb-1">Операция отклонена</div>
          <div>{insufficientError}</div>
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Тип операции</label>
              <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                <option value="income">Приход</option>
                <option value="expense">Расход</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Материал</label>
              <select
                className="form-select"
                name="material_id"
                value={form.material_id}
                onChange={handleChange}
                required
              >
                <option value="">Выберите материал</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Количество</label>
              <input
                className="form-control"
                type="number"
                min="0.001"
                step="0.001"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Добавить'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
