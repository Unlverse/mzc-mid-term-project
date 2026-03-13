import { apiRequest } from './api';

export async function getAdminOpsServerInfo(token, debugSessionId) {
  return apiRequest(`/admin/ops/server-info?_ts=${Date.now()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Debug-Session-Id': debugSessionId,
    },
  });
}
