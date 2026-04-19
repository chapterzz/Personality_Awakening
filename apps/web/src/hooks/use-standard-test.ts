/**
 * 标准模式测评：加载进度、答题、按 PRD 每 5 题（及完成时）PUT 保存，`if_match_revision` 与 409 采用服务端快照（PRD §2.5 MVP）。
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { getAccessToken } from '@/lib/auth-token';
import { getOrCreateGuestSessionId } from '@/lib/guest-session-id';
import {
  applyStandardAnswer,
  createInitialStandardProgress,
  shouldTriggerStandardAutosave,
  type StandardProgressDataV1,
} from '@/lib/progress-data';
import {
  getProgress,
  ProgressHttpError,
  ProgressNotFoundError,
  ProgressRevisionConflictError,
  putProgress,
} from '@/lib/progress-api';
import type { DemoQuestion, DemoStandardConfig } from '@/data/standard-demo-questionnaire';

export type StandardTestPhase = 'loading' | 'ready' | 'error';

export type UseStandardTestResult = {
  phase: StandardTestPhase;
  loadError: string | null;
  /** 自动保存失败（网络或非 409 错误） */
  saveError: string | null;
  clearSaveError: () => void;
  reload: () => void;
  /** 游客为 `guest`，已存 JWT 为 `user`（续答走 Bearer） */
  authMode: 'guest' | 'user';
  progressData: StandardProgressDataV1 | null;
  revision: number;
  saving: boolean;
  /** 409 后已采用服务端进度时短暂提示 */
  conflictNotice: boolean;
  totalQuestions: number;
  answeredCount: number;
  currentQuestion: DemoQuestion | null;
  isComplete: boolean;
  selectOption: (optionId: string | number) => Promise<void>;
};

export function useStandardTest(config: DemoStandardConfig): UseStandardTestResult {
  const [phase, setPhase] = useState<StandardTestPhase>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [progressData, setProgressData] = useState<StandardProgressDataV1 | null>(null);
  const [saving, setSaving] = useState(false);
  const [conflictNotice, setConflictNotice] = useState(false);
  const [authMode, setAuthMode] = useState<'guest' | 'user'>('guest');
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);

  const orderedIds = useMemo(() => [...config.orderedQuestionIds], [config.orderedQuestionIds]);

  const clearSaveError = useCallback(() => setSaveError(null), []);

  const reload = useCallback(() => {
    setLoadError(null);
    setSaveError(null);
    setPhase('loading');
    setLoadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = getAccessToken();
        const mode: 'guest' | 'user' = token ? 'user' : 'guest';
        const sid = token ? null : getOrCreateGuestSessionId();
        if (cancelled) return;
        setAuthMode(mode);
        setGuestSessionId(sid);

        const snap = await getProgress({
          accessToken: token,
          sessionId: sid ?? undefined,
        });
        if (cancelled) return;
        setRevision(snap.progress_revision);
        setProgressData(snap.progress_data);
        setConflictNotice(false);
        setPhase('ready');
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ProgressNotFoundError) {
          const token = getAccessToken();
          const sid = token ? null : getOrCreateGuestSessionId();
          setAuthMode(token ? 'user' : 'guest');
          setGuestSessionId(sid);
          setRevision(0);
          setProgressData(createInitialStandardProgress(orderedIds, config.questionnaireId));
          setConflictNotice(false);
          setPhase('ready');
        } else {
          const msg =
            e instanceof ProgressHttpError
              ? `请求失败（HTTP ${e.status}）`
              : e instanceof Error
                ? e.message
                : 'load_failed';
          setLoadError(msg);
          setPhase('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [config.questionnaireId, loadKey, orderedIds]);

  const totalQuestions = orderedIds.length;

  const answeredCount = progressData
    ? (progressData.standard.answered_count ?? Object.keys(progressData.standard.answers).length)
    : 0;

  const { currentQuestion, isComplete } = useMemo(() => {
    if (!progressData) {
      return { currentQuestion: null, isComplete: false };
    }
    const ordered = progressData.standard.ordered_question_ids ?? orderedIds;
    const idx = progressData.standard.current_index;
    if (idx >= ordered.length) {
      return { currentQuestion: null, isComplete: ordered.length > 0 };
    }
    const qid = ordered[idx];
    const q = qid ? config.questions[qid] : undefined;
    return { currentQuestion: q ?? null, isComplete: false };
  }, [config.questions, orderedIds, progressData]);

  const persist = useCallback(
    async (next: StandardProgressDataV1, ifMatch: number) => {
      const token = getAccessToken();
      const useUser = Boolean(token);
      return putProgress(
        { progress_data: next, if_match_revision: ifMatch },
        {
          accessToken: useUser ? token : null,
          sessionId: useUser ? undefined : (guestSessionId ?? undefined),
        },
      );
    },
    [guestSessionId],
  );

  const selectOption = useCallback(
    async (optionId: string | number) => {
      if (!progressData || phase !== 'ready' || saving) return;
      const ordered = progressData.standard.ordered_question_ids ?? orderedIds;
      if (progressData.standard.current_index >= ordered.length) return;

      const qid = ordered[progressData.standard.current_index];
      const next = applyStandardAnswer(progressData, qid, optionId);
      setProgressData(next);
      setSaveError(null);

      const ac = next.standard.answered_count ?? Object.keys(next.standard.answers).length;
      if (!shouldTriggerStandardAutosave(ac, totalQuestions)) {
        return;
      }

      setSaving(true);
      setConflictNotice(false);
      try {
        const out = await persist(next, revision);
        setRevision(out.progress_revision);
        setProgressData(out.progress_data);
        setSaveError(null);
      } catch (e) {
        if (e instanceof ProgressRevisionConflictError) {
          setProgressData(e.payload.progress_data);
          setRevision(e.payload.progress_revision);
          setConflictNotice(true);
          setSaveError(null);
          return;
        }
        if (e instanceof ProgressHttpError) {
          setSaveError(`保存失败（HTTP ${e.status}），请检查网络或稍后重试`);
        } else {
          setSaveError('保存失败，请稍后重试');
        }
      } finally {
        setSaving(false);
      }
    },
    [orderedIds, persist, phase, progressData, revision, saving, totalQuestions],
  );

  return {
    phase,
    loadError,
    saveError,
    clearSaveError,
    reload,
    authMode,
    progressData,
    revision,
    saving,
    conflictNotice,
    totalQuestions,
    answeredCount,
    currentQuestion,
    isComplete,
    selectOption,
  };
}
