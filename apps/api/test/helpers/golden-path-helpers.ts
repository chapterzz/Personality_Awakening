/**
 * API 集成测试辅助：Golden Path 唯一昵称、演示注册链、自适应完成态 seed、清理。
 */
import { INestApplication } from '@nestjs/common';
import { AssessmentMode } from '@prisma/client';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/prisma/prisma.service';

export const GOLDEN_PREFIX = 'e2e-golden-';

/** standard-v1 问卷 ID，与 Playwright helper 一致 */
export const STANDARD_QUESTIONNAIRE_ID = 'standard-v1';
export const EXPECTED_PRESENTED_COUNT = 48;

/** @deprecated 使用 STANDARD_QUESTIONNAIRE_ID */
export const ADAPTIVE_QUESTIONNAIRE_ID = STANDARD_QUESTIONNAIRE_ID;

/**
 * 生成带 e2e-golden- 前缀的唯一昵称，便于 afterEach 清理。
 * @param suffix 语义后缀，便于日志定位
 */
export function uniqueNickname(suffix: string): string {
  return `${GOLDEN_PREFIX}${suffix}-${randomUUID().slice(0, 8)}`;
}

/**
 * 等价 web `registerWithDemoTestResult`：PUT progress → POST register finalize。
 * @returns JWT 与 userId
 */
export async function registerWithDemoTestResultViaHttp(
  app: INestApplication,
  opts: { nickname: string; password: string; mbtiType?: string },
): Promise<{ accessToken: string; userId: string }> {
  const sessionId = `e2e-golden-sid-${randomUUID()}`;
  const mbtiType = opts.mbtiType ?? 'INFP';

  await request(app.getHttpServer())
    .put('/progress')
    .query({ mode: 'STANDARD', session_id: sessionId })
    .send({
      progress_data: {
        schema_version: 1,
        mode: 'STANDARD',
        standard: { current_index: 0, answers: { Q1: 'demo' } },
      },
      if_match_revision: 0,
    })
    .expect(200);

  const reg = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      nickname: opts.nickname,
      password: opts.password,
      guest_session_id: sessionId,
      finalize_submission: true,
      submission: {
        mode: AssessmentMode.STANDARD,
        scores: { demo: true },
        mbti_type: mbtiType,
      },
    })
    .expect(201);

  return {
    accessToken: reg.body.data.access_token as string,
    userId: reg.body.data.user.user_id as string,
  };
}

/**
 * 调用 POST /questionnaire/:id/sequence 获取 48 题题序（supertest 版）。
 */
export async function fetchStandardOrderedIds(
  app: INestApplication,
  options: { strategy?: 'shuffle' | 'reuse'; previous_ordered_question_ids?: string[] } = {
    strategy: 'shuffle',
  },
): Promise<string[]> {
  const res = await request(app.getHttpServer())
    .post(`/questionnaire/${STANDARD_QUESTIONNAIRE_ID}/sequence`)
    .send(options)
    .expect(201);

  const ids = res.body.data?.ordered_question_ids as string[] | undefined;
  if (!Array.isArray(ids) || ids.length !== EXPECTED_PRESENTED_COUNT) {
    throw new Error(`unexpected sequence body: ${JSON.stringify(res.body)}`);
  }
  return ids;
}

/** @deprecated 使用 fetchStandardOrderedIds */
export const fetchAdaptiveOrderedIds = fetchStandardOrderedIds;

/**
 * 为指定 session 写入已完成的标准模式进度（默认每题选 A 选项）。
 */
export async function seedGuestRandomStandardComplete(
  app: INestApplication,
  sessionId: string,
): Promise<void> {
  const fullOrdered = await fetchStandardOrderedIds(app);
  const allAnswers = Object.fromEntries(fullOrdered.map((id) => [id, `${id}_A`])) as Record<
    string,
    string
  >;

  const progress = {
    schema_version: 1,
    mode: 'STANDARD' as const,
    questionnaire_id: STANDARD_QUESTIONNAIRE_ID,
    standard: {
      current_index: fullOrdered.length,
      ordered_question_ids: fullOrdered,
      answers: allAnswers,
      answered_count: fullOrdered.length,
    },
    meta: { started_at: new Date().toISOString(), last_client: 'e2e' },
  };

  await request(app.getHttpServer())
    .put('/progress')
    .query({ mode: 'STANDARD', session_id: sessionId })
    .send({
      progress_data: progress,
      if_match_revision: 0,
    })
    .expect(200);
}

/** @deprecated 使用 seedGuestRandomStandardComplete */
export const seedGuestAdaptiveStandardComplete = seedGuestRandomStandardComplete;

/** 按 e2e-golden-* 前缀清理 User、TestResult、TemporarySession */
export async function cleanupGoldenPath(prisma: PrismaService): Promise<void> {
  const users = await prisma.user.findMany({
    where: { nickname: { startsWith: GOLDEN_PREFIX } },
    select: { id: true },
  });
  if (users.length === 0) return;
  const ids = users.map((u) => u.id);
  await prisma.testResult.deleteMany({ where: { userId: { in: ids } } });
  await prisma.temporarySession.deleteMany({
    where: { guestSessionId: { startsWith: 'e2e-golden-sid-' } },
  });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}
