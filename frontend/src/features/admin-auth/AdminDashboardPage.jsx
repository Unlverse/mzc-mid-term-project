import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminReservations,
  getAdminReservationSettings,
  updateAdminReservationSettings,
} from '../../services/auth';
import { clearAdminToken, getAdminToken } from '../../utils/auth-storage';

const reservationStatusLabelMap = {
  CONFIRMED: '예약 확정',
  ARRIVED: '입장 완료',
  NO_SHOW: '노쇼',
  CANCELED: '취소됨',
};

function StatusBadge({ kind = 'neutral', children }) {
  return <span className={`status-badge ${kind}`}>{children}</span>;
}

function getStatusKind(status) {
  if (status === 'CONFIRMED') return 'active';
  if (status === 'ARRIVED') return 'done';
  if (status === 'CANCELED') return 'muted';
  return 'danger';
}

function ReservationSettingsForm({ value, onChange, onSave, loading }) {
  return (
    <div className="form-stack">
      <div className="field-row">
        <label>
          <span>시작 시간</span>
          <input
            type="time"
            value={value.reservationStartTime}
            onChange={(event) => onChange('reservationStartTime', event.target.value)}
          />
        </label>
        <label>
          <span>종료 시간</span>
          <input
            type="time"
            value={value.reservationEndTime}
            onChange={(event) => onChange('reservationEndTime', event.target.value)}
          />
        </label>
      </div>
      <div className="field-row">
        <label>
          <span>예약 간격(분)</span>
          <input
            type="number"
            min="1"
            value={value.slotIntervalMinutes}
            onChange={(event) => onChange('slotIntervalMinutes', event.target.value)}
          />
        </label>
        <label>
          <span>시간 별 예약 가능 팀 수</span>
          <input
            type="number"
            min="1"
            max="50"
            value={value.slotCapacity}
            onChange={(event) => onChange('slotCapacity', event.target.value)}
          />
        </label>
      </div>
      <button type="button" onClick={onSave} disabled={loading}>
        {loading ? '저장 중...' : '예약 설정 저장'}
      </button>
    </div>
  );
}

function ReservationSettingsSnapshot({ value }) {
  return (
    <div className="reservation-settings-snapshot">
      <div className="reservation-settings-chip">
        <span className="muted">현재 시작 시간</span>
        <strong>{value.reservationStartTime}</strong>
      </div>
      <div className="reservation-settings-chip">
        <span className="muted">현재 종료 시간</span>
        <strong>{value.reservationEndTime}</strong>
      </div>
      <div className="reservation-settings-chip">
        <span className="muted">현재 간격</span>
        <strong>{value.slotIntervalMinutes}분</strong>
      </div>
      <div className="reservation-settings-chip">
        <span className="muted">현재 팀 수</span>
        <strong>{value.slotCapacity}팀</strong>
      </div>
    </div>
  );
}

function ReservationListSection({
  filters,
  items,
  loading,
  onFilterChange,
  onRefresh,
}) {
  return (
    <section className="section-card admin-panel admin-table-panel admin-span-full">
      <div className="section-head section-head-row">
        <div>
          <h2>예약 목록</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={loading}>
          {loading ? '불러오는 중...' : '새로고침'}
        </button>
      </div>
      <div className="field-row admin-filter-row">
        <label>
          <span>예약 날짜</span>
          <input
            type="date"
            value={filters.date}
            onChange={(event) => onFilterChange('date', event.target.value)}
          />
        </label>
        <label>
          <span>예약 상태</span>
          <select
            value={filters.status}
            onChange={(event) => onFilterChange('status', event.target.value)}
          >
            <option value="">전체</option>
            <option value="CONFIRMED">예약 확정</option>
            <option value="ARRIVED">입장 완료</option>
            <option value="NO_SHOW">노쇼</option>
            <option value="CANCELED">취소됨</option>
          </select>
        </label>
      </div>
      <div className="table-shell">
        <table className="data-table admin-data-table">
          <thead>
            <tr>
              <th>예약번호</th>
              <th>일시</th>
              <th>고객</th>
              <th>인원</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.reservationId} className="admin-reservation-row">
                  <td>
                    <div className="admin-reservation-number">{item.reservationNumber}</div>
                  </td>
                  <td>
                    <div className="admin-reservation-datetime">
                      <strong>{item.reservationTime.slice(0, 5)}</strong>
                      <span className="muted">{item.reservationDate}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-customer-cell">
                      <strong>{item.customerName}</strong>
                      <div className="muted">{item.customerPhone}</div>
                    </div>
                  </td>
                  <td>
                    <span className="admin-party-chip">{item.partySize}명</span>
                  </td>
                  <td>
                    <StatusBadge kind={getStatusKind(item.status)}>
                      {reservationStatusLabelMap[item.status] ?? item.status}
                    </StatusBadge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-cell">
                  조회된 예약이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [reservationForm, setReservationForm] = useState(null);
  const [reservationFilters, setReservationFilters] = useState({
    date: getTodayDate(),
    status: '',
  });
  const [reservationItems, setReservationItems] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reservationSaving, setReservationSaving] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);

  async function loadReservationItems(token, filters = reservationFilters) {
    setReservationLoading(true);
    try {
      const response = await getAdminReservations(token, filters);
      setReservationItems(response.items ?? []);
    } finally {
      setReservationLoading(false);
    }
  }

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    Promise.all([
      getAdminReservationSettings(token),
      getAdminReservations(token, reservationFilters),
    ])
      .then(([reservation, reservationList]) => {
        setReservationForm({
          reservationStartTime: reservation.reservationStartTime,
          reservationEndTime: reservation.reservationEndTime,
          slotIntervalMinutes: String(reservation.slotIntervalMinutes),
          slotCapacity: String(reservation.slotCapacity),
        });
        setReservationItems(reservationList.items ?? []);
      })
      .catch((requestError) => {
        setError(requestError.message);
        clearAdminToken();
        navigate('/admin/login');
      });
  }, [navigate]);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    loadReservationItems(token).catch((requestError) => setError(requestError.message));
  }, [reservationFilters]);

  function updateReservationField(field, nextValue) {
    setReservationForm((current) => ({ ...current, [field]: nextValue }));
  }

  function updateReservationFilter(field, nextValue) {
    setReservationFilters((current) => ({ ...current, [field]: nextValue }));
  }

  async function handleReservationSubmit() {
    const token = getAdminToken();
    if (!token || !reservationForm) return;
    setReservationSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const payload = {
        reservationStartTime: String(reservationForm.reservationStartTime ?? '').trim(),
        reservationEndTime: String(reservationForm.reservationEndTime ?? '').trim(),
        slotIntervalMinutes: Number(String(reservationForm.slotIntervalMinutes ?? '').trim()),
        slotCapacity: Number(String(reservationForm.slotCapacity ?? '').trim()),
      };
      await updateAdminReservationSettings(token, payload);
      const updated = await getAdminReservationSettings(token);
      setReservationForm({
        reservationStartTime: updated.reservationStartTime,
        reservationEndTime: updated.reservationEndTime,
        slotIntervalMinutes: String(updated.slotIntervalMinutes),
        slotCapacity: String(updated.slotCapacity),
      });
      setSuccessMessage('예약 설정을 저장했습니다.');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setReservationSaving(false);
    }
  }

  async function handleReservationRefresh() {
    const token = getAdminToken();
    if (!token) return;
    setError('');
    try {
      await loadReservationItems(token);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page-shell admin-page-shell">
      <div className="card dashboard-card admin-dashboard-card refined-card">
        <div className="admin-dashboard-topbar">
          <div>
            <p className="eyebrow">mzc</p>
            <h1>운영 대시보드</h1>
          </div>
          <div className="action-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate('/admin/ops')}
            >
              운영 확인
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                clearAdminToken();
                navigate('/admin/login');
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
        {error ? <div className="error-text">{error}</div> : null}
        {successMessage ? <div className="success-text">{successMessage}</div> : null}
        {reservationForm ? (
          <div className="dashboard-sections admin-dashboard-grid">
            <section className="section-card admin-panel admin-span-full">
              <div className="section-head">
                <h2>예약 설정</h2> 
              </div>
              <ReservationSettingsSnapshot value={reservationForm} />
              <ReservationSettingsForm
                value={reservationForm}
                onChange={updateReservationField}
                onSave={handleReservationSubmit}
                loading={reservationSaving}
              />
            </section>
            <ReservationListSection
              filters={reservationFilters}
              items={reservationItems}
              loading={reservationLoading}
              onFilterChange={updateReservationFilter}
              onRefresh={handleReservationRefresh}
            />
          </div>
        ) : (
          <p className="muted">불러오는 중...</p>
        )}
      </div>
    </div>
  );
}
