import type { StatsResponse, VersionResponse } from './types';

const API_BASE = '/api';

function getHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchStats(token: string): Promise<StatsResponse> {
  const res = await fetch(`${API_BASE}/v1/admin/stats/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`Stats request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchVersion(token: string): Promise<VersionResponse> {
  const res = await fetch(`${API_BASE}/v1/version/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`Version request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
