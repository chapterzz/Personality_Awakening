/**
 * AVG 剧情：加载进度、节点确认后 PUT（与 T2.1 相同的 `if_match_revision` / 409 处理，PRD §2.5）。
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AvgScriptConfig, AvgNode } from '@/data/avg-demo-script';
import { getAccessToken } from '@/lib/auth-token';
import {
  getAvgBranchProgressStepIndex,
  getAvgBranchProgressTotalSteps,
  getAvgNode,
  isAvgEndNode,
} from '@/lib/avg-script';
import { getOrCreateGuestSessionId } from '@/lib/guest-session-id';
import {
  applyAvgAdvance,
  createInitialAvgProgress,
  isStandardAssessmentComplete,
  type AvgProgressDataV1,
} from '@/lib/progress-data';
import {
  getProgress,
  type ProgressSnapshot,
  ProgressHttpError,
  ProgressNotFoundError,
  ProgressRevisionConflictError,
  putProgress,
} from '@/lib/progress-api';

/** 标准卷已结束后，同一会话用 PUT 切换为 AVG 起点（演示跨模式；正式提交仍走 TestResult）。 */
async function putInitialAvgReplacingStandard(
  config: AvgScriptConfig,
  ifMatch: number,
  auth: { accessToken: string | null; sessionId?: string },
): Promise<ProgressSnapshot> {
  const start = getAvgNode(config, config.start_node_id);
  const initial = createInitialAvgProgress(config.script_id, config.start_node_id, start?.chapter);
  return putProgress(
    { progress_data: initial, if_match_revision: ifMatch },
    {
      accessToken: auth.accessToken,
      sessionId: auth.sessionId,
    },
  );
}

export type AvgTestPhase = 'loading' | 'ready' | 'error' | 'wrong_mode' | 'script_mismatch';

export type UseAvgTestResult = {
  phase: AvgTestPhase;
  loadError: string | null;
  saveError: string | null;
  clearSaveError: () => void;
  reload: () => void;
  authMode: 'guest' | 'user';
  progressData: AvgProgressDataV1 | null;
  revision: number;
  saving: boolean;
  conflictNotice: boolean;
  currentNode: AvgNode | null;
  isComplete: boolean;
  /** 已完成的「关键分支」步数（`avg.answers` 键数；纯对白继续不计入） */
  stepIndex: number;
  /** 脚本中选项节点总数；无选项节点时回退为全节点数（兼容异常脚本） */
  totalSteps: number;
  continueDialogue: () => Promise<void>;
  selectOption: (optionId: string) => Promise<void>;
};

export function useAvgTest(config: AvgScriptConfig): UseAvgTestResult {
  const [phase, setPhase] = useState<AvgTestPhase>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [progressData, setProgressData] = useState<AvgProgressDataV1 | null>(null);
  const [saving, setSaving] = useState(false);
  const [conflictNotice, setConflictNotice] = useState(false);
  const [authMode, setAuthMode] = useState<'guest' | 'user'>('guest');
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);

  const totalSteps = useMemo(() => getAvgBranchProgressTotalSteps(config), [config]);

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
          if (!isStandardAssessmentComplete(snap.progress_data)) {
            setPhase('wrong_mode');
            return;
          }
          const auth = { accessToken: token, sessionId: sid ?? undefined };
          try {
            const out = await putInitialAvgReplacingStandard(config, snap.progress_revision, auth);
            if (cancelled) return;
            setRevision(out.progress_revision);
            if (out.progress_data.mode === 'AVG') {
              setProgressData(out.progress_data);
            }
            setConflictNotice(false);
            setPhase('ready');
          } catch (e) {
            if (cancelled) return;
            if (e instanceof ProgressRevisionConflictError) {
              const p = e.payload.progress_data;
              if (p.mode === 'AVG') {
                if (p.avg.script_id !== config.script_id) {
                  setPhase('script_mismatch');
                  return;
                }
                setRevision(e.payload.progress_revision);
                setProgressData(p);
                setConflictNotice(true);
                setPhase('ready');
                return;
              }
              if (p.mode === 'STANDARD' && isStandardAssessmentComplete(p)) {
                try {
                  const out2 = await putInitialAvgReplacingStandard(
                    config,
                    e.payload.progress_revision,
                    auth,
                  );
                  if (cancelled) return;
                  setRevision(out2.progress_revision);
                  if (out2.progress_data.mode === 'AVG') {
                    setProgressData(out2.progress_data);
                  }
                  setConflictNotice(true);
                  setPhase('ready');
                } catch (e2) {
                  if (cancelled) return;
                  if (e2 instanceof ProgressRevisionConflictError) {
                    const p2 = e2.payload.progress_data;
                    if (p2.mode === 'AVG') {
                      if (p2.avg.script_id !== config.script_id) {
                        setPhase('script_mismatch');
                        return;
                      }
                      setRevision(e2.payload.progress_revision);
                      setProgressData(p2);
                      setConflictNotice(true);
                      setPhase('ready');
                      return;
                    }
                  }
                  const msg =
                    e2 instanceof ProgressHttpError
                      ? `请求失败（HTTP ${e2.status}）`
                      : e2 instanceof Error
                        ? e2.message
                        : 'transition_failed';
                  setLoadError(msg);
                  setPhase('error');
                }
                return;
              }
              setPhase('wrong_mode');
              return;
            }
            const msg =
              e instanceof ProgressHttpError
                ? `请求失败（HTTP ${e.status}）`
                : e instanceof Error
                  ? e.message
                  : 'transition_failed';
            setLoadError(msg);
            setPhase('error');
          }
          return;
        }

        if (
          snap.progress_data.mode === 'AVG' &&
          snap.progress_data.avg.script_id !== config.script_id
        ) {
          setPhase('script_mismatch');
          return;
        }

        if (snap.progress_data.mode !== 'AVG') {
          setLoadError('unexpected_progress_mode');
          setPhase('error');
          return;
        }

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
          const start = getAvgNode(config, config.start_node_id);
          setRevision(0);
          setProgressData(
            createInitialAvgProgress(config.script_id, config.start_node_id, start?.chapter),
          );
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
  }, [config, loadKey]);

  const persist = useCallback(
    async (next: AvgProgressDataV1, ifMatch: number) => {
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

  const saveAndSync = useCallback(
    async (next: AvgProgressDataV1) => {
      setSaving(true);
      setConflictNotice(false);
      try {
        const out = await persist(next, revision);
        setRevision(out.progress_revision);
        if (out.progress_data.mode === 'AVG') {
          setProgressData(out.progress_data);
        }
        setSaveError(null);
      } catch (e) {
        if (e instanceof ProgressRevisionConflictError) {
          if (e.payload.progress_data.mode === 'AVG') {
            setProgressData(e.payload.progress_data);
          }
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
    [persist, revision],
  );

  const continueDialogue = useCallback(async () => {
    if (!progressData || phase !== 'ready' || saving) return;
    const node = getAvgNode(config, progressData.avg.node_id);
    if (!node || node.kind !== 'dialogue') return;

    const nextId = node.next_id;
    const nextNode = getAvgNode(config, nextId);
    if (!nextNode) {
      setSaveError('剧情配置缺少下一节点，请刷新页面');
      return;
    }

    const next = applyAvgAdvance(progressData, nextId, {
      chapter: nextNode.chapter ?? progressData.avg.chapter,
    });
    setProgressData(next);
    setSaveError(null);
    await saveAndSync(next);
  }, [config, phase, progressData, saveAndSync, saving]);

  const selectOption = useCallback(
    async (optionId: string) => {
      if (!progressData || phase !== 'ready' || saving) return;
      const node = getAvgNode(config, progressData.avg.node_id);
      if (!node || node.kind !== 'choice') return;

      const opt = node.options.find((o) => o.id === optionId);
      if (!opt) return;

      const nextNode = getAvgNode(config, opt.next_id);
      if (!nextNode) {
        setSaveError('剧情配置缺少下一节点，请刷新页面');
        return;
      }

      const atNodeId = progressData.avg.node_id;
      const next = applyAvgAdvance(progressData, opt.next_id, {
        choice: { atNodeId, optionId },
        chapter: nextNode.chapter ?? progressData.avg.chapter,
      });
      setProgressData(next);
      setSaveError(null);
      await saveAndSync(next);
    },
    [config, phase, progressData, saveAndSync, saving],
  );

  const { currentNode, isComplete, stepIndex } = useMemo(() => {
    if (!progressData) {
      return { currentNode: null, isComplete: false, stepIndex: 0 };
    }
    const n = getAvgNode(config, progressData.avg.node_id);
    if (!n) {
      return { currentNode: null, isComplete: false, stepIndex: 0 };
    }
    const stepIndex = getAvgBranchProgressStepIndex(config, progressData.avg);
    return {
      currentNode: n,
      isComplete: isAvgEndNode(n),
      stepIndex,
    };
  }, [config, progressData]);

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
    currentNode,
    isComplete,
    stepIndex,
    totalSteps,
    continueDialogue,
    selectOption,
  };
}
