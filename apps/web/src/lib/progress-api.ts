/**
 * 浏览器端调用 Nest `/progress`：统一解析 `{ success, data, message }`，处理 409 乐观锁冲突体；支持 DELETE 清空进行中会话。
 */
import { getBrowserApiBaseUrl } from './api-base';
import type { ProgressDataV1, ProgressMode } from './progress-data';

export type ProgressSnapshot = {
  session_id: string;
  user_id: string | null;
  progress_data: ProgressDataV1;
  progress_revision: number;
  updated_at: string;
  expires_at: string;
};

export type PutProgressBody = {
  progress_data: ProgressDataV1;
  if_match_revision: number;
};

export type ProgressConflictPayload = {
  progress_data: ProgressDataV1;
  progress_revision: number;
  updated_at: string;
};

export class ProgressRevisionConflictError extends Error {
  readonly name = 'ProgressRevisionConflictError';
  constructor(readonly payload: ProgressConflictPayload) {
    super('progress_revision_conflict');
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function parseProgressSnapshot(raw: unknown): ProgressSnapshot {
  if (!isRecord(raw)) {
    throw new Error('invalid progress snapshot');
  }
  const progress_data = raw.progress_data as ProgressDataV1;
  if (
    typeof raw.session_id !== 'string' ||
    (raw.user_id !== null && typeof raw.user_id !== 'string') ||
    typeof raw.progress_revision !== 'number' ||
    typeof raw.updated_at !== 'string' ||
    typeof raw.expires_at !== 'string'
  ) {
    throw new Error('invalid progress snapshot fields');
  }
  return {
    session_id: raw.session_id,
    user_id: raw.user_id as string | null,
    progress_data,
    progress_revision: raw.progress_revision,
    updated_at: raw.updated_at,
    expires_at: raw.expires_at,
  };
}

export function parseConflictPayload(raw: unknown): ProgressConflictPayload {
  if (!isRecord(raw)) {
    throw new Error('invalid conflict payload');
  }
  const progress_data = raw.progress_data as ProgressDataV1;
  if (typeof raw.progress_revision !== 'number' || typeof raw.updated_at !== 'string') {
    throw new Error('invalid conflict payload fields');
  }
  return {
    progress_data,
    progress_revision: raw.progress_revision,
    updated_at: raw.updated_at,
  };
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function getProgress(params: {
  mode: ProgressMode;
  sessionId?: string;
  accessToken?: string | null;
}): Promise<ProgressSnapshot> {
  const base = getBrowserApiBaseUrl();
  const url = new URL(`${base.replace(/\/$/, '')}/progress`);
  url.searchParams.set('mode', params.mode);
  if (params.accessToken) {
    // 注册用户：仅 Bearer
  } else if (params.sessionId) {
    url.searchParams.set('session_id', params.sessionId);
  } else {
    throw new Error('sessionId or accessToken required');
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
    },
    credentials: 'omit',
  });

  const body = await parseJson(res);
  if (res.status === 404) {
    throw new ProgressNotFoundError();
  }
  if (!res.ok) {
    throw new ProgressHttpError(res.status, body);
  }
  if (!isRecord(body) || body.success !== true) {
    throw new Error('unexpected progress response');
  }
  return parseProgressSnapshot(body.data);
}

export class ProgressNotFoundError extends Error {
  readonly name = 'ProgressNotFoundError';
  constructor() {
    super('progress_not_found');
  }
}

export class ProgressHttpError extends Error {
  readonly name = 'ProgressHttpError';
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`progress_http_${status}`);
  }
}

export async function putProgress(
  body: PutProgressBody,
  params: { mode: ProgressMode; sessionId?: string; accessToken?: string | null },
): Promise<ProgressSnapshot> {
  const base = getBrowserApiBaseUrl();
  const url = new URL(`${base.replace(/\/$/, '')}/progress`);
  url.searchParams.set('mode', params.mode);
  if (params.accessToken) {
    // Bearer only
  } else if (params.sessionId) {
    url.searchParams.set('session_id', params.sessionId);
  } else {
    throw new Error('sessionId or accessToken required');
  }

  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
    },
    body: JSON.stringify(body),
    credentials: 'omit',
  });

  const json = await parseJson(res);

  if (res.status === 409) {
    if (isRecord(json) && json.success === false && isRecord(json.data)) {
      throw new ProgressRevisionConflictError(parseConflictPayload(json.data));
    }
    throw new Error('409 without conflict payload');
  }

  if (!res.ok) {
    throw new ProgressHttpError(res.status, json);
  }

  if (!isRecord(json) || json.success !== true) {
    throw new Error('unexpected put progress response');
  }
  return parseProgressSnapshot(json.data);
}

/** 删除服务端进行中进度；无记录时抛 `ProgressNotFoundError`（404）。 */
export async function deleteProgress(params: {
  mode: ProgressMode;
  sessionId?: string;
  accessToken?: string | null;
}): Promise<void> {
  const base = getBrowserApiBaseUrl();
  const url = new URL(`${base.replace(/\/$/, '')}/progress`);
  url.searchParams.set('mode', params.mode);
  if (params.accessToken) {
    // Bearer only
  } else if (params.sessionId) {
    url.searchParams.set('session_id', params.sessionId);
  } else {
    throw new Error('sessionId or accessToken required');
  }

  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
    },
    credentials: 'omit',
  });

  const json = await parseJson(res);

  if (res.status === 404) {
    throw new ProgressNotFoundError();
  }
  if (!res.ok) {
    throw new ProgressHttpError(res.status, json);
  }
  if (!isRecord(json) || json.success !== true) {
    throw new Error('unexpected delete progress response');
  }
}
