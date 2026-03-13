import { Link } from 'react-router-dom';
import { HomeIconLink } from '../components/HomeIconLink';

export function LookupHubPage() {
  return (
    <div className="page-shell lookup-page-shell">
      <div className="card lookup-hub-card refined-card">
        <div className="dashboard-header simple-header">
          <div>
            <p className="eyebrow">Lookup</p>
            <h1>조회하기</h1>
            <p className="muted">예약 내역을 확인하려면 아래 카드로 이동하세요.</p>
          </div>
          <HomeIconLink />
        </div>

        <div className="lookup-hub-grid single-column-grid">
          <Link to="/reservation/lookup" className="lookup-option-card">
            <span className="lookup-option-label">Reservation</span>
            <strong>예약 조회</strong>
            <p>예약번호, 전화번호, 임시 비밀번호로 예약 정보를 확인합니다.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
