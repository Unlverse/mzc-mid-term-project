import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIconLink } from '../components/HomeIconLink';
import { lookupReservation } from '../services/reservation';
import { setReservationLookup, setReservationResult } from '../utils/reservation-storage';

export function ReservationLookupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ reservationNumber: '', customerPhone: '', temporaryPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await lookupReservation(form);
      setReservationResult(result);
      setReservationLookup(form);
      navigate('/reservation/result');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell lookup-page-shell">
      <div className="card lookup-form-card refined-card">
        <div className="dashboard-header simple-header">
          <div>
            <p className="eyebrow">Reservation Check</p>
            <h1>예약 조회</h1>
          </div>
          <HomeIconLink />
        </div>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            <span>예약번호</span>
            <input value={form.reservationNumber} onChange={(event) => setForm((current) => ({ ...current, reservationNumber: event.target.value }))} />
          </label>
          <label>
            <span>전화번호</span>
            <input value={form.customerPhone} onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))} />
          </label>
          <label>
            <span>임시 비밀번호</span>
            <input value={form.temporaryPassword} onChange={(event) => setForm((current) => ({ ...current, temporaryPassword: event.target.value }))} />
          </label>
          {error ? <div className="error-text">{error}</div> : null}
          <button type="submit" disabled={loading}>
            {loading ? '조회 중...' : '예약 조회'}
          </button>
        </form>
      </div>
    </div>
  );
}
