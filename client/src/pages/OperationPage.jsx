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
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Операции со складом</h1>
          <p className="page-header__subtitle">Поступление материалов и выдача по заявке</p>
        </div>
      </header>

      {insufficientError && (
        <div className="alert alert--danger" role="alert">
          <div>
            <div className="alert__title">Операция отклонена</div>
            <div>{insufficientError}</div>
          </div>
        </div>
      )}
      {error && <div className="alert alert--danger">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <section className="panel">
        <div className="panel__body">
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-field__label" htmlFor="op-type">
                Тип операции
              </label>
              <select
                id="op-type"
                className="form-field__select"
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                <option value="income">Поступление на склад</option>
                <option value="expense">Выдача со склада (заявка)</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="op-material">
                Материал
              </label>
              <select
                id="op-material"
                className="form-field__select"
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

            <div className="form-field">
              <label className="form-field__label" htmlFor="op-quantity">
                Количество
              </label>
              <input
                id="op-quantity"
                className="form-field__input"
                type="number"
                min="0.001"
                step="0.001"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <button className="btn btn--primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner spinner--sm" aria-hidden="true" />
                  Сохранение...
                </>
              ) : (
                'Добавить'
              )}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
