import { API_BASE_URL } from '../constants/api';
import { apiRequest } from './api';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveGalleryImageUrl(path) {
  if (!path) {
    return '';
  }

  if (path.startsWith('/assets/')) {
    return path;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function getGalleryImages() {
  return apiRequest(`/gallery?_ts=${Date.now()}`, {
    method: 'GET',
  });
}
