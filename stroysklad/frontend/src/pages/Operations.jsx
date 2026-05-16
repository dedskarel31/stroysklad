import { useEffect, useState } from 'react';
import api from '../api/axiosInstance.js';

export default function Operations() {
  const [materials, setMaterials] = useState([]);
  const [stock, setStock] = useState([]);
  const [type, setType] = useState('income');
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/materials'), api.get('/stock')])
      .then(([m, s]) => {
        setMaterials(m.data);
        setStock(s.data);
      })
      .catch(err => setError(err.response?.data?.error || 'Не удалось загрузить данные'));
  }, []);

  // Текущий остаток выбранного материала (для отображения при расходе)
  const currentStock = stock.find(s => String(s.material_id) === String(materialId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const endpoint = type === 'income' ? '/transactions/income' : '/transactions/expense';
      const { data } = await api.post(endpoint, {
        material_id: Number(materialId),
        quantity: Number(quantity),
        comment: comment.trim() || undefined,
      });
      setSuccess(
        `Операция выполнена успешно. Новый остаток: ${Number(data.new_quantity).toLocaleString('ru-RU')} ${currentStock?.unit || ''}`
      );
      // Сброс формы
      setQuantity('');
      setComment('');
      // Обновляем остатки
      const s = await api.get('/stock');
      setStock(s.data);
    } catch (err) {
      const data = err.response?.data;
      if (data?.error === 'Недостаточно материала на складе' && typeof data.available === 'number') {
        setError(`Недостаточно материала на складе. Доступно: ${data.available} ${currentStock?.unit || ''}`);
      } else {
        setError(data?.error || 'Не удалось выполнить операцию');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-7">
        <h2 className="mb-4">Регистрация складской операции</h2>

        <div className="card shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Тип операции</label>
                <div className="btn-group w-100" role="group">
                  <input
                    type="radio"
                    className="btn-check"
                    id="t-income"
                    checked={type === 'income'}
                    onChange={() => setType('income')}
                  />
                  <label className="btn btn-outline-success" htmlFor="t-income">
                    ➕ Приход
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    id="t-expense"
                    checked={type === 'expense'}
                    onChange={() => setType('expense')}
                  />
                  <label className="btn btn-outline-warning" htmlFor="t-expense">
                    ➖ Расход
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="material" className="form-label fw-semibold">Материал</label>
                <select
                  id="material"
                  className="form-select"
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  required
                >
                  <option value="">— Выберите материал —</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.unit})
                    </option>
                  ))}
                </select>

                {type === 'expense' && currentStock && (
                  <div className="form-text mt-2">
                    Текущий остаток:{' '}
                    <strong className={currentStock.is_deficit ? 'text-danger' : 'text-success'}>
                      {Number(currentStock.quantity).toLocaleString('ru-RU')} {currentStock.unit}
                    </strong>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="qty" className="form-label fw-semibold">Количество</label>
                <input
                  id="qty"
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="cmt" className="form-label">Комментарий <small className="text-muted">(необязательно)</small></label>
                <textarea
                  id="cmt"
                  className="form-control"
                  rows="2"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Например: поставка по договору №14/2026"
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <button
                type="submit"
                className={`btn w-100 ${type === 'income' ? 'btn-success' : 'btn-warning'}`}
                disabled={submitting || !materialId || !quantity}
              >
                {submitting ? 'Выполняем…' : 'Выполнить операцию'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
