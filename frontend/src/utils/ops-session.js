const OPS_DEBUG_SESSION_KEY = 'opsDebugSession';
const OPS_DEBUG_COUNTERS_KEY = 'opsDebugCounters';

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `debug-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateOpsSessionId() {
  const existing = sessionStorage.getItem(OPS_DEBUG_SESSION_KEY);

  if (existing) {
    return existing;
  }

  const nextValue = createSessionId();
  sessionStorage.setItem(OPS_DEBUG_SESSION_KEY, nextValue);
  return nextValue;
}

export function getOpsCounters() {
  const rawValue = sessionStorage.getItem(OPS_DEBUG_COUNTERS_KEY);

  if (!rawValue) {
    return { totalChecks: 0, podCounts: {} };
  }

  try {
    const parsed = JSON.parse(rawValue);
    return {
      totalChecks: parsed.totalChecks ?? 0,
      podCounts: parsed.podCounts ?? {},
    };
  } catch {
    return { totalChecks: 0, podCounts: {} };
  }
}

export function recordOpsPodHit(podName) {
  const current = getOpsCounters();
  const next = {
    totalChecks: current.totalChecks + 1,
    podCounts: {
      ...current.podCounts,
      [podName]: (current.podCounts[podName] ?? 0) + 1,
    },
  };

  sessionStorage.setItem(OPS_DEBUG_COUNTERS_KEY, JSON.stringify(next));
  return next;
}

export function resetOpsCounters() {
  sessionStorage.removeItem(OPS_DEBUG_COUNTERS_KEY);
}
