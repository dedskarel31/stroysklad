import { useEffect, useState } from 'react';
import { fetchAdminSettings, updateAdminSettings } from '../api.js';

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    organization_name: '',
    allow_registration: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAdminSettings();
        setForm({
          organization_name: data.organization_name || '',
          allow_registration: data.allow_registration === 'true' || data.allow_registration === true,
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await updateAdminSettings(form);
      setSuccess('0AB@>9:8 A>E@0=5=K');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" aria-label="03@C7:0" />
      </div>
    );
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">0AB@>9:8 A8AB5<K</h1>
          <p className="page-header__subtitle">0@0<5B@K @01>BK 8=D>@<0F8>==>9 A8AB5<K</p>
        </div>
      </header>

      {error && <div className="alert alert--danger">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <section className="panel">
        <div className="panel__body">
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-field__label" htmlFor="org-name">
                0720=85 >@30=870F88
              </label>
              <input
                id="org-name"
                className="form-field__input"
                value={form.organization_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, organization_name: e.target.value }))
                }
                required
              />
            </div>

            <div className="form-field">
              <label className="form-field__label">
                <input
                  type="checkbox"
                  checked={form.allow_registration}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, allow_registration: e.target.checked }))
                  }
                  style={{ marginRight: '0.5rem' }}
                />
                 07@5H8BL @538AB@0F8N =>2KE ?>;L7>20B5;59 (@>;L �;04>2I8:�)
              </label>
            </div>

            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? '!>E@0=5=85...' : '!>E@0=8BL'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
