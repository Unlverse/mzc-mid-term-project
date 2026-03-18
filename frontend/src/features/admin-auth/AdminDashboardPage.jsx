import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteAdminGalleryImage,
  getAdminReservations,
  getAdminReservationSettings,
  updateAdminReservationSettings,
  uploadAdminGalleryImage,
} from '../../services/auth';
import { getGalleryImages, resolveGalleryImageUrl } from '../../services/gallery';
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

function GalleryManagerSection({
  items,
  loading,
  uploading,
  deletingName,
  selectedFile,
  onFileChange,
  onRefresh,
  onUpload,
  onDelete,
}) {
  return (
    <section className="section-card admin-panel admin-span-full">
      <div className="section-head section-head-row">
        <div>
          <h2>갤러리 관리</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={loading}>
          {loading ? '불러오는 중...' : '새로고침'}
        </button>
      </div>
      <div className="form-stack">
        <label className="admin-gallery-upload-field">
          <span>이미지 업로드</span>
          <div className="admin-gallery-upload-shell">
            <span className="admin-gallery-file-name">
              {selectedFile?.name ?? '업로드할 이미지를 선택해 주세요.'}
            </span>
            <span className="admin-gallery-file-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect
                  x="4"
                  y="5"
                  width="16"
                  height="14"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                <path
                  d="M7 16l3.2-3.4a1 1 0 011.46 0L14 15l1.6-1.8a1 1 0 011.48.02L19 15.4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input type="file" accept="image/*" onChange={onFileChange} />
          </div>
        </label>
        <button type="button" onClick={onUpload} disabled={!selectedFile || uploading}>
          {uploading ? '업로드 중...' : '갤러리 이미지 업로드'}
        </button>
      </div>
      <div className="admin-gallery-list">
        {items.length > 0 ? (
          items.map((item) => (
            <article key={item.name} className="admin-gallery-item">
              <div
                className="admin-gallery-thumb"
                style={{
                  backgroundImage: `url('${resolveGalleryImageUrl(item.url)}')`,
                }}
              />
              <div className="admin-gallery-meta">
                <strong>{item.name}</strong>
                <span className="muted">
                  {item.uploadedAt
                    ? new Date(item.uploadedAt).toLocaleString('ko-KR')
                    : '업로드 시간 확인 불가'}
                </span>
              </div>
              <button
                type="button"
                className="danger-button action-button-soft"
                onClick={() => onDelete(item.name)}
                disabled={deletingName === item.name}
              >
                {deletingName === item.name ? '삭제 중...' : '삭제'}
              </button>
            </article>
          ))
        ) : (
          <p className="muted admin-gallery-empty">업로드된 이미지가 없습니다.</p>
        )}
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
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedGalleryFile, setSelectedGalleryFile] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reservationSaving, setReservationSaving] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryDeletingName, setGalleryDeletingName] = useState('');

  async function loadReservationItems(token, filters = reservationFilters) {
    setReservationLoading(true);
    try {
      const response = await getAdminReservations(token, filters);
      setReservationItems(response.items ?? []);
    } finally {
      setReservationLoading(false);
    }
  }

  async function loadGalleryItems() {
    setGalleryLoading(true);
    try {
      const response = await getGalleryImages();
      setGalleryItems(response.items ?? []);
    } finally {
      setGalleryLoading(false);
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
        getGalleryImages(),
      ])
      .then(([reservation, reservationList, gallery]) => {
        setReservationForm({
          reservationStartTime: reservation.reservationStartTime,
          reservationEndTime: reservation.reservationEndTime,
          slotIntervalMinutes: String(reservation.slotIntervalMinutes),
          slotCapacity: String(reservation.slotCapacity),
        });
        setReservationItems(reservationList.items ?? []);
        setGalleryItems(gallery.items ?? []);
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

  async function handleGalleryUpload() {
    const token = getAdminToken();
    if (!token || !selectedGalleryFile) return;
    setGalleryUploading(true);
    setError('');
    setSuccessMessage('');

    try {
      await uploadAdminGalleryImage(token, selectedGalleryFile);
      setSelectedGalleryFile(null);
      await loadGalleryItems();
      setSuccessMessage('갤러리 이미지를 업로드했습니다.');
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setGalleryUploading(false);
    }
  }

  async function handleGalleryDelete(fileName) {
    const token = getAdminToken();
    if (!token || !fileName) return;

    setGalleryDeletingName(fileName);
    setError('');
    setSuccessMessage('');

    try {
      await deleteAdminGalleryImage(token, fileName);
      await loadGalleryItems();
      setSuccessMessage('갤러리 이미지를 삭제했습니다.');
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setGalleryDeletingName('');
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
              세션 확인
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
            <GalleryManagerSection
              items={galleryItems}
              loading={galleryLoading}
              uploading={galleryUploading}
              deletingName={galleryDeletingName}
              selectedFile={selectedGalleryFile}
              onFileChange={(event) =>
                setSelectedGalleryFile(event.target.files?.[0] ?? null)
              }
              onRefresh={() => {
                loadGalleryItems().catch((requestError) =>
                  setError(requestError.message),
                );
              }}
              onUpload={handleGalleryUpload}
              onDelete={handleGalleryDelete}
            />
          </div>
        ) : (
          <p className="muted">불러오는 중...</p>
        )}
      </div>
    </div>
  );
}
