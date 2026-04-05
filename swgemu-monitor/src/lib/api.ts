import type {
  StatsResponse,
  VersionResponse,
  Galaxy,
  Account,
  AccountDetail,
  Character,
  PaginatedResponse,
  ActionResult,
  ConfigResult,
} from './types';

const API_BASE = '/api';
const DB_BASE = '/db';

function getHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function jsonHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ---- Existing endpoints ----

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

// ---- Database endpoints (via Vite middleware) ----

export async function fetchGalaxy(): Promise<Galaxy> {
  const res = await fetch(`${DB_BASE}/galaxy`);
  if (!res.ok) throw new Error(`Galaxy fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchAccounts(
  page = 1,
  limit = 25,
  search?: string
): Promise<PaginatedResponse<Account>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  const res = await fetch(`${DB_BASE}/accounts?${params}`);
  if (!res.ok) throw new Error(`Accounts fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchAccount(id: number): Promise<AccountDetail> {
  const res = await fetch(`${DB_BASE}/accounts/${id}`);
  if (!res.ok) throw new Error(`Account fetch failed: ${res.status}`);
  return res.json();
}

export async function searchCharactersDB(
  search: string
): Promise<Character[]> {
  const params = new URLSearchParams({ search });
  const res = await fetch(`${DB_BASE}/characters?${params}`);
  if (!res.ok) throw new Error(`Character search failed: ${res.status}`);
  return res.json();
}

// ---- REST API: Character/Object endpoints ----

export async function searchCharacters(
  token: string,
  search: string,
  options?: { recursive?: boolean; maxdepth?: number; limit?: number; offset?: number }
): Promise<unknown> {
  const params = new URLSearchParams({ search });
  if (options?.recursive) params.set('recursive', 'true');
  if (options?.maxdepth !== undefined) params.set('maxdepth', String(options.maxdepth));
  if (options?.limit !== undefined) params.set('limit', String(options.limit));
  if (options?.offset !== undefined) params.set('offset', String(options.offset));
  const res = await fetch(`${API_BASE}/v1/find/character/?${params}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Character search failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchObject(
  token: string,
  oid: string,
  recursive = false,
  maxdepth = 3
): Promise<unknown> {
  const params = new URLSearchParams();
  if (recursive) {
    params.set('recursive', 'true');
    params.set('maxdepth', String(maxdepth));
  }
  const query = params.toString();
  const res = await fetch(`${API_BASE}/v1/object/${oid}/${query ? '?' + query : ''}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Object fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

// ---- REST API: Account/Character moderation ----

export async function kickCharacter(
  token: string,
  accountID: number,
  galaxyID: number,
  characterID: string,
  adminOID: string,
  reason: string
): Promise<ActionResult> {
  const res = await fetch(
    `${API_BASE}/v1/admin/account/${accountID}/galaxy/${galaxyID}/character/${characterID}/`,
    {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({ command: 'kick', admin: adminOID, reason }),
    }
  );
  if (!res.ok) throw new Error(`Kick failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function banAccount(
  token: string,
  accountID: number,
  adminOID: string,
  reason: string,
  expires?: number
): Promise<ActionResult> {
  const body: Record<string, unknown> = { command: 'ban', admin: adminOID, reason };
  if (expires !== undefined) body.expires = expires;
  const res = await fetch(`${API_BASE}/v1/admin/account/${accountID}/`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Ban failed: ${res.status} ${res.statusText}`);
  return res.json();
}

// ---- REST API: Chat ----

export async function sendMail(
  token: string,
  from: string,
  to: string,
  subject: string,
  body: string
): Promise<unknown> {
  const res = await fetch(`${API_BASE}/v1/chat/mail/`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ from, to, subject, body }),
  });
  if (!res.ok) throw new Error(`Send mail failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function sendMessage(
  token: string,
  from: string,
  to: string,
  body: string
): Promise<unknown> {
  const res = await fetch(`${API_BASE}/v1/chat/message/`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ from, to, body }),
  });
  if (!res.ok) throw new Error(`Send message failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function broadcastGalaxy(
  token: string,
  from: string,
  body: string
): Promise<unknown> {
  const res = await fetch(`${API_BASE}/v1/chat/galaxy/`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ from, body }),
  });
  if (!res.ok) throw new Error(`Broadcast failed: ${res.status} ${res.statusText}`);
  return res.json();
}

// ---- REST API: Config ----

export async function fetchConfig(
  token: string,
  key?: string
): Promise<ConfigResult> {
  const path = key ? `/v1/admin/config/${key}/` : '/v1/admin/config/';
  const res = await fetch(`${API_BASE}${path}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Config fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function updateConfig(
  token: string,
  key: string,
  value: string
): Promise<unknown> {
  const params = new URLSearchParams({ value });
  const res = await fetch(`${API_BASE}/v1/admin/config/${key}/?${params}`, {
    method: 'PUT',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Config update failed: ${res.status} ${res.statusText}`);
  return res.json();
}

// ---- REST API: Stats ----

export async function resetStats(token: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/v1/admin/stats/?reset=true`, {
    method: 'PUT',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Stats reset failed: ${res.status} ${res.statusText}`);
  return res.json();
}

// ---- REST API: Console ----

export async function runConsoleCommand(
  token: string,
  command: string,
  args?: string
): Promise<unknown> {
  const params = args ? `?args=${encodeURIComponent(args)}` : '';
  const res = await fetch(`${API_BASE}/v1/admin/console/${command}/${params}`, {
    method: 'POST',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Console command failed: ${res.status} ${res.statusText}`);
  return res.json();
}

// ---- REST API: Object mutation ----

export async function deleteObject(
  token: string,
  oid: string
): Promise<unknown> {
  const res = await fetch(`${API_BASE}/v1/object/${oid}/`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status} ${res.statusText}`);
  return res.json();
}
