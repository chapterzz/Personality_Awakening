/**
 * 认证 API 客户端：注册、登录；可选通过游客会话转化写入演示 TestResult。
 */
import { getBrowserApiBaseUrl } from '@/lib/api-base';
import { putProgress } from '@/lib/progress-api';

export type AuthUser = {
  user_id: string;
  nickname: string;
  role: string;
};

export type AuthResult = {
  access_token: string;
  token_type: 'Bearer';
  user: AuthUser;
};

type AuthResponse = {
  success: boolean;
  data: AuthResult | null;
  message: string | null;
};

async function parseAuthResponse(res: Response): Promise<AuthResult> {
  const body = (await res.json()) as AuthResponse;
  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.message ?? `auth_http_${res.status}`);
  }
  return body.data;
}

/**
 * 昵称 + 密码注册。
 */
export async function registerUser(nickname: string, password: string): Promise<AuthResult> {
  const base = getBrowserApiBaseUrl();
  const res = await fetch(`${base.replace(/\/$/, '')}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password }),
  });
  return parseAuthResponse(res);
}

/**
 * 昵称 + 密码登录。
 */
export async function loginUser(nickname: string, password: string): Promise<AuthResult> {
  const base = getBrowserApiBaseUrl();
  const res = await fetch(`${base.replace(/\/$/, '')}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password }),
  });
  return parseAuthResponse(res);
}

/**
 * 注册并写入演示测评结果（游客 progress + finalize_submission，供看板高亮验收）。
 */
export async function registerWithDemoTestResult(
  nickname: string,
  password: string,
  mbtiType = 'INFP',
): Promise<AuthResult> {
  const sessionId =
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `demo_${Date.now()}`;

  await putProgress(
    {
      progress_data: {
        schema_version: 1,
        mode: 'STANDARD',
        standard: { current_index: 0, answers: { Q1: 'demo' } },
      },
      if_match_revision: 0,
    },
    { mode: 'STANDARD', sessionId },
  );

  const base = getBrowserApiBaseUrl();
  const res = await fetch(`${base.replace(/\/$/, '')}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname,
      password,
      guest_session_id: sessionId,
      finalize_submission: true,
      submission: {
        mode: 'STANDARD',
        scores: { demo: true },
        mbti_type: mbtiType,
      },
    }),
  });
  return parseAuthResponse(res);
}
