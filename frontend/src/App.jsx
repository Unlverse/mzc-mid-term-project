import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminDashboardPage } from './features/admin-auth/AdminDashboardPage';
import { AdminLoginPage } from './features/admin-auth/AdminLoginPage';
import { AdminOpsPage } from './pages/AdminOpsPage';
import { HomePage } from './pages/HomePage';
import { LookupHubPage } from './pages/LookupHubPage';
import { ReservationLookupPage } from './pages/ReservationLookupPage';
import { ReservationPage } from './pages/ReservationPage';
import { ReservationResultPage } from './pages/ReservationResultPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/lookup" element={<LookupHubPage />} />
      <Route path="/reservation" element={<ReservationPage />} />
      <Route path="/reservation/lookup" element={<ReservationLookupPage />} />
      <Route path="/reservation/result" element={<ReservationResultPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/ops" element={<AdminOpsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
