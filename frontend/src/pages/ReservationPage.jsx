import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIconLink } from '../components/HomeIconLink';
import { createReservation, getAvailableReservationTimes } from '../services/reservation';
import { setReservationLookup, setReservationResult } from '../utils/reservation-storage';

function getDefaultDate() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (
    tomorrow.getFullYear() === today.getFullYear() &&
    tomorrow.getMonth() === today.getMonth()
  ) {
    return tomorrow.toISOString().slice(0, 10);
  }

  return today.toISOString().slice(0, 10);
}

function getMonthDateRange() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);

  return {
    minDate: today.toISOString().slice(0, 10),
    maxDate: lastDate.toISOString().slice(0, 10),
    monthLabel: `${year}.${String(month + 1).padStart(2, '0')}`,
    firstDate: firstDate.toISOString().slice(0, 10),
  };
}

export function ReservationPage() {
  const navigate = useNavigate();
  const { minDate, maxDate, monthLabel } = getMonthDateRange();
  const [date, setDate] = useState(getDefaultDate());
  const [times, setTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [form, setForm] = useState({ customerName: '', customerPhone: '', partySize: 2 });
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoadingTimes(true);
    setError('');

    getAvailableReservationTimes(date)
      .then((result) => {
        if (!mounted) return;
        setTimes(result.times ?? []);
        const firstAvailable = (result.times ?? []).find((item) => item.available);
        setSelectedTime(firstAvailable?.time ?? '');
      })
      .catch((requestError) => {
        if (!mounted) return;
        setTimes([]);
        setSelectedTime('');
        setError(requestError.message);
      })
      .finally(() => {
        if (mounted) {
          setLoadingTimes(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [date]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await createReservation({
        ...form,
        partySize: Number(form.partySize),
        reservationDate: date,
        reservationTime: selectedTime,
      });
      setReservationResult(result);
      setReservationLookup({
        reservationNumber: result.reservationNumber,
        customerPhone: result.customerPhone,
        temporaryPassword: result.temporaryPassword,
      });
      navigate('/reservation/result');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="card dashboard-card reservation-form-shell refined-card">
        <div className="dashboard-header">
          <div>
            <h1>예약하기</h1>
          </div>
          <HomeIconLink />
        </div>
        {error ? <div className="error-text">{error}</div> : null}
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            <span>예약 날짜 ({monthLabel} 예약만 가능)</span>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <div className="time-grid">
            {loadingTimes ? (
              <p className="muted">예약 가능 시간을 불러오는 중...</p>
            ) : times.length ? (
              times.map((item) => (
                <button
                  key={item.time}
                  type="button"
                  className={`time-chip ${selectedTime === item.time ? 'active' : ''}`}
                  disabled={!item.available}
                  onClick={() => setSelectedTime(item.time)}
                >
                  <span>{item.time}</span>
                  <small>{item.available ? `${item.remainingCount}팀 가능` : '마감'}</small>
                </button>
              ))
            ) : (
              <p className="muted">예약 가능한 시간이 없습니다.</p>
            )}
          </div>
          <div className="field-row">
            <label>
              <span>고객명</span>
              <input value={form.customerName} onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} />
            </label>
            <label>
              <span>전화번호</span>
              <input value={form.customerPhone} onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))} />
            </label>
          </div>
          <label>
            <span>인원 수</span>
            <input type="number" min="1" max="10" value={form.partySize} onChange={(event) => setForm((current) => ({ ...current, partySize: event.target.value }))} />
          </label>
          <button type="submit" disabled={submitting || !selectedTime}>
            {submitting ? '예약 생성 중...' : '예약 확정하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
