import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIconLink } from '../components/HomeIconLink';
import { getAdminOpsServerInfo } from '../services/ops';
import { clearAdminToken, getAdminToken } from '../utils/auth-storage';
import {
  getOpsCounters,
  getOrCreateOpsSessionId,
  recordOpsPodHit,
  resetOpsCounters,
} from '../utils/ops-session';

export function AdminOpsPage() {
  const navigate = useNavigate();
  const debugSessionId = useMemo(() => getOrCreateOpsSessionId(), []);
  const [serverInfo, setServerInfo] = useState(null);
  const [stats, setStats] = useState(() => getOpsCounters());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchServerInfo() {
    const token = getAdminToken();

    if (!token) {
      navigate('/admin/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await getAdminOpsServerInfo(token, debugSessionId);
      setServerInfo(response);
      setStats(recordOpsPodHit(response.podName));
    } catch (requestError) {
      setError(requestError.message);

      if (requestError.message?.toLowerCase().includes('unauthorized')) {
        clearAdminToken();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServerInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const podEntries = Object.entries(stats.podCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="page-shell admin-page-shell">
      <div className="card dashboard-card admin-dashboard-card refined-card">
        <div className="dashboard-header ops-page-header">
          <div>
            <h1>운영 확인</h1>
            <p className="muted">새로고침할 때마다 현재 응답 파드와 로그인 유지 상태를 확인할 수 있습니다.</p>
          </div>
          <div className="action-row">
            <button type="button" className="secondary-button" onClick={fetchServerInfo} disabled={loading}>
              {loading ? '확인 중...' : '새로고침'}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                resetOpsCounters();
                setStats(getOpsCounters());
              }}
            >
              카운트 초기화
            </button>
            <HomeIconLink to="/admin/dashboard" />
          </div>
        </div>

        {error ? <div className="error-text">{error}</div> : null}

        <div className="ops-grid">
          <div className="info-item">
            <span className="muted">현재 파드</span>
            <strong>{serverInfo?.podName ?? '-'}</strong>
          </div>
          <div className="info-item">
            <span className="muted">세션 ID</span>
            <strong>{debugSessionId}</strong>
          </div>
          <div className="info-item">
            <span className="muted">로그인 사용자</span>
            <strong>{serverInfo?.manager?.loginId ?? '-'}</strong>
          </div>
          <div className="info-item">
            <span className="muted">총 확인 횟수</span>
            <strong>{stats.totalChecks}</strong>
          </div>
        </div>

        <section className="section-card admin-panel ops-breakdown-panel">
          <div className="section-head">
            <h2>파드별 응답 횟수</h2>
          </div>
          {podEntries.length ? (
            <div className="ops-pod-list">
              {podEntries.map(([podName, count]) => (
                <div key={podName} className="ops-pod-row">
                  <span>{podName}</span>
                  <strong>{count}회</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">아직 확인 기록이 없습니다.</p>
          )}
        </section>
      </div>
    </div>
  );
}
