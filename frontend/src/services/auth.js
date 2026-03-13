import { apiRequest } from './api';

export async function loginAdmin(payload) {
  return apiRequest('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAdminReservationSettings(token) {
  return apiRequest(`/admin/reservation-settings?_ts=${Date.now()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateAdminReservationSettings(token, payload) {
  return apiRequest('/admin/reservation-settings', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminReservations(token, filters = {}) {
  const params = new URLSearchParams();

  if (filters.date) {
    params.set('date', filters.date);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  params.set('_ts', String(Date.now()));

  const query = params.toString();

  return apiRequest(`/admin/reservations${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
