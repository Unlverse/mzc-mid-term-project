import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIconLink } from '../../components/HomeIconLink';
import { loginAdmin } from '../../services/auth';
import { setAdminToken } from '../../utils/auth-storage';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await loginAdmin(form);
      setAdminToken(result.accessToken);
      navigate('/admin/dashboard');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="card auth-card refined-card">
        <div className="dashboard-header simple-header">
          <div>
            <h1>관리자 로그인</h1>
          </div>
          <HomeIconLink />
        </div>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            <span>아이디</span>
            <input
              value={form.loginId}
              onChange={(event) =>
                setForm((current) => ({ ...current, loginId: event.target.value }))
              }
            />
          </label>
          <label>
            <span>비밀번호</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </label>
          {error ? <div className="error-text">{error}</div> : null}
          <button type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
