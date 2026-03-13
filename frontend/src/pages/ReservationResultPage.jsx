import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { HomeIconLink } from '../components/HomeIconLink';
import { cancelReservation } from '../services/reservation';
import {
  clearReservationLookup,
  clearReservationResult,
  getReservationLookup,
  getReservationResult,
  setReservationResult,
} from '../utils/reservation-storage';

const reservationStatusLabelMap = {
  CONFIRMED: '예약 확정',
  ARRIVED: '입장 완료',
  NO_SHOW: '노쇼',
  CANCELED: '취소됨',
};

export function ReservationResultPage() {
  const [reservation, setReservation] = useState(getReservationResult());
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const lookup = getReservationLookup();

  if (!reservation) {
    return <Navigate to="/reservation/lookup" replace />;
  }

  async function handleCancel() {
    if (!lookup) {
      setError('취소에 필요한 조회 정보가 없습니다. 다시 조회 후 시도해 주세요.');
      return;
    }

    setCanceling(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await cancelReservation(lookup);
      const nextReservation = { ...reservation, status: result.status };
      setReservation(nextReservation);
      setReservationResult(nextReservation);
      setSuccessMessage('예약을 취소했습니다.');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setCanceling(false);
    }
  }

  function handleReset() {
    clearReservationResult();
    clearReservationLookup();
  }

  return (
    <div className="page-shell">
      <div className="card auth-card refined-card reservation-result-card">
        <div className="dashboard-header simple-header reservation-result-header">
          <div>
            <h1>예약 정보</h1>
            <p className="muted">생성 직후 또는 조회 결과를 확인할 수 있습니다.</p>
          </div>
          <HomeIconLink
            className="reservation-home-link"
            onClick={handleReset}
          />
        </div>

        {error ? <div className="error-text">{error}</div> : null}
        {successMessage ? <div className="success-text">{successMessage}</div> : null}

        <div className="info-grid compact-grid reservation-info-grid">
          <div className="info-item reservation-highlight-item">
            <span className="muted">예약번호</span>
            <strong>{reservation.reservationNumber}</strong>
          </div>
          <div className="info-item reservation-highlight-item">
            <span className="muted">상태</span>
            <strong>{reservationStatusLabelMap[reservation.status] ?? reservation.status}</strong>
          </div>
          <div className="info-item">
            <span className="muted">예약 날짜</span>
            <strong>{reservation.reservationDate}</strong>
          </div>
          <div className="info-item">
            <span className="muted">예약 시간</span>
            <strong>{reservation.reservationTime}</strong>
          </div>
          <div className="info-item">
            <span className="muted">고객명</span>
            <strong>{reservation.customerName}</strong>
          </div>
          <div className="info-item">
            <span className="muted">전화번호</span>
            <strong>{reservation.customerPhone}</strong>
          </div>
          <div className="info-item">
            <span className="muted">인원 수</span>
            <strong>{reservation.partySize}명</strong>
          </div>
          {reservation.temporaryPassword ? (
            <div className="info-item warning-item reservation-password-item">
              <span className="muted">임시 비밀번호</span>
              <strong>{reservation.temporaryPassword}</strong>
            </div>
          ) : null}
        </div>

        <div className="action-row reservation-result-actions">
          <button
            type="button"
            className="danger-button"
            disabled={canceling || reservation.status !== 'CONFIRMED'}
            onClick={handleCancel}
          >
            {canceling ? '취소 중...' : '예약 취소'}
          </button>
        </div>
      </div>
    </div>
  );
}
