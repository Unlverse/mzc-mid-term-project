import { apiRequest } from './api';

export async function getAvailableReservationTimes(date) {
  const params = new URLSearchParams({
    date,
    _ts: String(Date.now()),
  });

  return apiRequest(`/reservations/available-times?${params.toString()}`, {
    method: 'GET',
  });
}

export async function createReservation(payload) {
  return apiRequest('/reservations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function lookupReservation(payload) {
  return apiRequest('/reservations/lookup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelReservation(payload) {
  return apiRequest('/reservations/cancel', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
