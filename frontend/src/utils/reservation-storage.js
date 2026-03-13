const RESERVATION_RESULT_KEY = 'reservationResult';
const RESERVATION_LOOKUP_KEY = 'reservationLookup';

export function setReservationResult(value) {
  sessionStorage.setItem(RESERVATION_RESULT_KEY, JSON.stringify(value));
}

export function getReservationResult() {
  const value = sessionStorage.getItem(RESERVATION_RESULT_KEY);
  return value ? JSON.parse(value) : null;
}

export function clearReservationResult() {
  sessionStorage.removeItem(RESERVATION_RESULT_KEY);
}

export function setReservationLookup(value) {
  sessionStorage.setItem(RESERVATION_LOOKUP_KEY, JSON.stringify(value));
}

export function getReservationLookup() {
  const value = sessionStorage.getItem(RESERVATION_LOOKUP_KEY);
  return value ? JSON.parse(value) : null;
}

export function clearReservationLookup() {
  sessionStorage.removeItem(RESERVATION_LOOKUP_KEY);
}
