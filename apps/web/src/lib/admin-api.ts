/**
 * Admin 题库 CMS API 客户端（T4.6）。
 */
import { getBrowserApiBaseUrl } from '@/lib/api-base';
import { getAdminToken } from '@/lib/admin-auth';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

function apiBase(): string {
  return getBrowserApiBaseUrl().replace(/\/$/, '');
}

function authHeaders(): HeadersInit {
  const token = getAdminToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<T> & { message?: string };
  if (!res.ok || !body.success) {
    throw new Error(body.message ?? `admin_api_${res.status}`);
  }
  return body.data;
}

export type AdminQuestionnaireSummary = {
  id: string;
  title: string;
  isPublished: boolean;
  publishedAt: string | null;
  _count: { questions: number };
};

export type AdminOption = {
  id: string;
  label: string;
  valueKey: string;
  dimension: string | null;
  side: string | null;
  weight: number | null;
};

export type AdminQuestion = {
  id: string;
  prompt: string;
  sortOrder: number;
  dimension: string | null;
  groupTag: string | null;
  groupSortOrder: number | null;
  options: AdminOption[];
};

export type AdminQuestionnaireDetail = {
  id: string;
  title: string;
  isPublished: boolean;
  publishedAt: string | null;
  questions: AdminQuestion[];
};

/** 问卷列表 */
export async function fetchAdminQuestionnaires(): Promise<AdminQuestionnaireSummary[]> {
  const res = await fetch(`${apiBase()}/admin/questionnaires`, {
    headers: authHeaders(),
  });
  return parseEnvelope(res);
}

/** 问卷详情 */
export async function fetchAdminQuestionnaire(id: string): Promise<AdminQuestionnaireDetail> {
  const res = await fetch(`${apiBase()}/admin/questionnaires/${encodeURIComponent(id)}`, {
    headers: authHeaders(),
  });
  return parseEnvelope(res);
}

/** 发布问卷 */
export async function publishQuestionnaire(id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/admin/questionnaires/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
    headers: authHeaders(),
  });
  await parseEnvelope(res);
}

/** 下架问卷 */
export async function unpublishQuestionnaire(id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/admin/questionnaires/${encodeURIComponent(id)}/unpublish`, {
    method: 'POST',
    headers: authHeaders(),
  });
  await parseEnvelope(res);
}

/** 更新题目题干 */
export async function updateQuestionPrompt(
  questionnaireId: string,
  questionId: string,
  prompt: string,
): Promise<void> {
  const res = await fetch(
    `${apiBase()}/admin/questionnaires/${encodeURIComponent(questionnaireId)}/questions/${encodeURIComponent(questionId)}`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ prompt }),
    },
  );
  await parseEnvelope(res);
}

/** 更新选项字段 */
export async function updateOption(
  optionId: string,
  patch: Partial<Pick<AdminOption, 'label' | 'valueKey' | 'dimension' | 'side' | 'weight'>>,
): Promise<void> {
  const res = await fetch(`${apiBase()}/admin/options/${encodeURIComponent(optionId)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  await parseEnvelope(res);
}

/** 更新题目 T2.7 分组字段 */
export async function updateQuestionMeta(
  questionnaireId: string,
  questionId: string,
  patch: Partial<Pick<AdminQuestion, 'groupTag' | 'dimension' | 'groupSortOrder' | 'sortOrder'>>,
): Promise<void> {
  const res = await fetch(
    `${apiBase()}/admin/questionnaires/${encodeURIComponent(questionnaireId)}/questions/${encodeURIComponent(questionId)}`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(patch),
    },
  );
  await parseEnvelope(res);
}

/** 删除题目（硬删） */
export async function deleteQuestion(questionnaireId: string, questionId: string): Promise<void> {
  const res = await fetch(
    `${apiBase()}/admin/questionnaires/${encodeURIComponent(questionnaireId)}/questions/${encodeURIComponent(questionId)}`,
    { method: 'DELETE', headers: authHeaders() },
  );
  await parseEnvelope(res);
}
