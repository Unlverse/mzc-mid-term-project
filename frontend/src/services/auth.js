import { apiRequest } from './api';

const ADMIN_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

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

function getErrorMessage(data) {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  return 'Request failed.';
}

export async function uploadAdminGalleryImage(token, file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${ADMIN_API_BASE_URL}/admin/gallery`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
}

export async function deleteAdminGalleryImage(token, fileName) {
  return apiRequest(`/admin/gallery/${encodeURIComponent(fileName)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
