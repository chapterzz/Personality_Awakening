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
  type AvgProgressDataV1,
  type StandardProgressDataV1,
} from '@/lib/progress-data';
import {
  getProgress,
  ProgressHttpError,
  ProgressNotFoundError,
  ProgressRevisionConflictError,
  putProgress,
} from '@/lib/progress-api';
import { DEMO_AVG_SCRIPT } from '@/data/avg-demo-script';
import type { DemoQuestion, DemoStandardConfig } from '@/data/standard-demo-questionnaire';
import { isAvgProgressAtEndForScript } from '@/lib/avg-script';

export type StandardTestPhase = 'loading' | 'ready' | 'error' | 'wrong_mode';

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

        if (snap.progress_data.mode === 'STANDARD') {
          setRevision(snap.progress_revision);
          setProgressData(snap.progress_data);
          setConflictNotice(false);
          setPhase('ready');
          return;
        }

        if (snap.progress_data.mode === 'AVG') {
          const avgSnap = snap.progress_data as AvgProgressDataV1;
          if (isAvgProgressAtEndForScript(DEMO_AVG_SCRIPT, avgSnap)) {
            const authPut = {
              accessToken: token,
              sessionId: token ? undefined : (sid ?? undefined),
            };
            const initial = createInitialStandardProgress(orderedIds, config.questionnaireId);
            try {
              const out = await putProgress(
                { progress_data: initial, if_match_revision: snap.progress_revision },
                authPut,
              );
              if (cancelled) return;
              if (out.progress_data.mode !== 'STANDARD') {
                setPhase('wrong_mode');
                return;
              }
              setRevision(out.progress_revision);
              setProgressData(out.progress_data);
              setConflictNotice(false);
              setPhase('ready');
              return;
            } catch (e) {
              if (cancelled) return;
              if (e instanceof ProgressRevisionConflictError) {
                const p = e.payload.progress_data;
                if (p.mode === 'STANDARD') {
                  setRevision(e.payload.progress_revision);
                  setProgressData(p);
                  setConflictNotice(true);
                  setPhase('ready');
                  return;
                }
                if (
                  p.mode === 'AVG' &&
                  isAvgProgressAtEndForScript(DEMO_AVG_SCRIPT, p as AvgProgressDataV1)
                ) {
                  try {
                    const out2 = await putProgress(
                      { progress_data: initial, if_match_revision: e.payload.progress_revision },
                      authPut,
                    );
                    if (cancelled) return;
                    if (out2.progress_data.mode === 'STANDARD') {
                      setRevision(out2.progress_revision);
                      setProgressData(out2.progress_data);
                      setConflictNotice(true);
                      setPhase('ready');
                      return;
                    }
                  } catch (e2) {
                    if (cancelled) return;
                    if (e2 instanceof ProgressRevisionConflictError) {
                      const p2 = e2.payload.progress_data;
                      if (p2.mode === 'STANDARD') {
                        setRevision(e2.payload.progress_revision);
                        setProgressData(p2);
                        setConflictNotice(true);
                        setPhase('ready');
                        return;
                      }
                    }
                    const msg2 =
                      e2 instanceof ProgressHttpError
                        ? `请求失败（HTTP ${e2.status}）`
                        : e2 instanceof Error
                          ? e2.message
                          : 'transition_failed';
                    setLoadError(msg2);
                    setPhase('error');
                    return;
                  }
                }
              }
              const msg =
                e instanceof ProgressHttpError
                  ? `请求失败（HTTP ${e.status}）`
                  : e instanceof Error
                    ? e.message
                    : 'transition_failed';
              setLoadError(msg);
              setPhase('error');
              return;
            }
          }
          setPhase('wrong_mode');
          return;
        }

        setPhase('wrong_mode');
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
        if (out.progress_data.mode !== 'STANDARD') {
          setProgressData(null);
          setPhase('wrong_mode');
          setSaveError(null);
          return;
        }
        setProgressData(out.progress_data);
        setSaveError(null);
      } catch (e) {
        if (e instanceof ProgressRevisionConflictError) {
          if (e.payload.progress_data.mode !== 'STANDARD') {
            setProgressData(null);
            setRevision(e.payload.progress_revision);
            setPhase('wrong_mode');
            setSaveError(null);
            return;
          }
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
