/**
 * 自适应标准模式测评 hook（T2.7）：从服务端获取问卷结构与题序，支持筛选轮→追问轮的渐进式题序扩展。
 * 接口与 useStandardTest 对齐，便于页面组件无缝切换。
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { QuestionnaireQuestion } from '@/data/questionnaire-types';
import { getAccessToken } from '@/lib/auth-token';
import { getOrCreateGuestSessionId } from '@/lib/guest-session-id';
import {
  applyStandardAnswer,
  createInitialStandardProgress,
  type StandardProgressDataV1,
} from '@/lib/progress-data';
import {
  getProgress,
  ProgressHttpError,
  ProgressNotFoundError,
  ProgressRevisionConflictError,
  putProgress,
} from '@/lib/progress-api';
import {
  fetchQuestionnaire,
  fetchQuestionSequence,
  type ApiQuestionnaireData,
} from '@/lib/questionnaire-api';

export type AdaptiveStandardTestPhase = 'loading' | 'ready' | 'error';

export type UseAdaptiveStandardTestResult = {
  phase: AdaptiveStandardTestPhase;
  loadError: string | null;
  saveError: string | null;
  clearSaveError: () => void;
  reload: () => void;
  authMode: 'guest' | 'user';
  progressData: StandardProgressDataV1 | null;
  revision: number;
  saving: boolean;
  conflictNotice: boolean;
  totalQuestions: number;
  answeredCount: number;
  currentQuestion: QuestionnaireQuestion | null;
  isComplete: boolean;
  /** 题目 lookup map（用于计分 buildStandardSignals） */
  questionsMap: Record<string, QuestionnaireQuestion>;
  restart: () => Promise<void>;
  selectOption: (optionId: string | number) => Promise<void>;
};

/** 筛选轮题目数量（与 seed 数据中 groupTag='screening' 的题数一致） */
const SCREENING_COUNT = 4;

export function useAdaptiveStandardTest(questionnaireId: string): UseAdaptiveStandardTestResult {
  const [phase, setPhase] = useState<AdaptiveStandardTestPhase>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [progressData, setProgressData] = useState<StandardProgressDataV1 | null>(null);
  const [saving, setSaving] = useState(false);
  const [conflictNotice, setConflictNotice] = useState(false);
  const [authMode, setAuthMode] = useState<'guest' | 'user'>('guest');
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);

  // 问卷结构缓存（题目 lookup map）
  const [questionsMap, setQuestionsMap] = useState<Record<string, QuestionnaireQuestion>>({});
  // 是否已完成筛选轮追问（防止重复调用）
  const screeningExtendedRef = useRef(false);
  // 用于在异步回调中读取最新值，避免闭包过期
  const progressDataRef = useRef(progressData);
  const revisionRef = useRef(revision);

  // 同步 ref，保证异步回调中能读到最新值
  useEffect(() => {
    progressDataRef.current = progressData;
  }, [progressData]);
  useEffect(() => {
    revisionRef.current = revision;
  }, [revision]);

  const clearSaveError = useCallback(() => setSaveError(null), []);

  const reload = useCallback(() => {
    setLoadError(null);
    setSaveError(null);
    setPhase('loading');
    setLoadKey((k) => k + 1);
    screeningExtendedRef.current = false;
  }, []);

  // 将服务端问卷结构转换为前端 QuestionnaireQuestion map
  const toQuestionsMap = useCallback(
    (data: ApiQuestionnaireData): Record<string, QuestionnaireQuestion> => {
      const map: Record<string, QuestionnaireQuestion> = {};
      for (const q of data.questions) {
        map[q.id] = {
          id: q.id,
          text: q.prompt,
          options: q.options.map((o) => ({
            id: o.id,
            label: o.label,
            dimension: (o.dimension ?? 'EI') as QuestionnaireQuestion['options'][0]['dimension'],
            side: (o.side ?? 'E') as QuestionnaireQuestion['options'][0]['side'],
            weight: (o.weight ?? 2) as 1 | 2 | 3,
          })),
        };
      }
      return map;
    },
    [],
  );

  // 初始加载：获取问卷结构 + 已有进度（或创建初始进度）
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 并行获取问卷结构和已有进度
        const questionnairePromise = fetchQuestionnaire(questionnaireId);

        const token = getAccessToken();
        const mode: 'guest' | 'user' = token ? 'user' : 'guest';
        const sid = token ? null : getOrCreateGuestSessionId();
        if (cancelled) return;
        setAuthMode(mode);
        setGuestSessionId(sid);

        const questionnaireData = await questionnairePromise;
        if (cancelled) return;
        const qMap = toQuestionsMap(questionnaireData);
        setQuestionsMap(qMap);

        // 尝试获取已有进度
        try {
          const snap = await getProgress({
            mode: 'STANDARD',
            accessToken: token,
            sessionId: sid ?? undefined,
          });
          if (cancelled) return;

          if (snap.progress_data.mode !== 'STANDARD') {
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
            // 无已有进度，获取初始题序并创建进度
            const seqData = await fetchQuestionSequence(questionnaireId);
            if (cancelled) return;

            const initial = createInitialStandardProgress(
              seqData.ordered_question_ids,
              questionnaireId,
            );
            setRevision(0);
            setProgressData(initial);
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
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'load_failed';
        setLoadError(msg);
        setPhase('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [questionnaireId, loadKey, toQuestionsMap]);

  const orderedIds = useMemo(() => {
    if (progressData?.standard.ordered_question_ids) {
      return progressData.standard.ordered_question_ids;
    }
    return Object.keys(questionsMap);
  }, [progressData, questionsMap]);

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
    const q = qid ? questionsMap[qid] : undefined;
    return { currentQuestion: q ?? null, isComplete: false };
  }, [questionsMap, orderedIds, progressData]);

  // 持久化进度到服务端（useCallback 保证引用稳定，供 useEffect 和 selectOption 调用）
  const persist = useCallback(
    async (next: StandardProgressDataV1, ifMatch: number) => {
      const token = getAccessToken();
      const useUser = Boolean(token);
      return putProgress(
        { progress_data: next, if_match_revision: ifMatch },
        {
          mode: 'STANDARD',
          accessToken: useUser ? token : null,
          sessionId: useUser ? undefined : (guestSessionId ?? undefined),
        },
      );
    },
    [guestSessionId],
  );

  // 筛选轮完成后自动扩展题序
  useEffect(() => {
    if (phase !== 'ready' || !progressData || screeningExtendedRef.current) return;

    const currentIndex = progressData.standard.current_index;
    const answers = progressData.standard.answers;

    // 当答完筛选轮所有题目时，调用 sequence 接口获取扩展题序
    if (currentIndex >= SCREENING_COUNT && Object.keys(answers).length >= SCREENING_COUNT) {
      screeningExtendedRef.current = true;

      fetchQuestionSequence(questionnaireId, answers)
        .then((seqData) => {
          // 通过 ref 读取最新值，避免闭包过期导致数据丢失或 revision 冲突
          const latestData = progressDataRef.current;
          if (!latestData) return;
          const currentOrdered = latestData.standard.ordered_question_ids ?? orderedIds;
          // 合并：保留已有的，追加新的
          const merged = [...currentOrdered];
          for (const id of seqData.ordered_question_ids) {
            if (!merged.includes(id)) {
              merged.push(id);
            }
          }
          // 只有题序确实增长了才更新
          if (merged.length > currentOrdered.length) {
            const updated: StandardProgressDataV1 = {
              ...latestData,
              standard: {
                ...latestData.standard,
                ordered_question_ids: merged,
              },
            };
            setProgressData(updated);
            // 立即持久化扩展后的题序
            void persist(updated, revisionRef.current);
          }
        })
        .catch(() => {
          // 扩展失败不阻塞答题，使用当前题序继续
          screeningExtendedRef.current = false;
        });
    }
  }, [phase, progressData, questionnaireId, orderedIds, revision, persist]);

  const restart = useCallback(async () => {
    if (phase !== 'ready' || saving) return;
    const current = progressData;
    if (!current) return;

    // 重新获取初始题序
    screeningExtendedRef.current = false;
    let initialIds: string[];
    try {
      const seqData = await fetchQuestionSequence(questionnaireId);
      initialIds = seqData.ordered_question_ids;
    } catch {
      initialIds = current.standard.ordered_question_ids ?? orderedIds;
    }

    const initial = createInitialStandardProgress(initialIds, questionnaireId);

    setSaving(true);
    setConflictNotice(false);
    try {
      const out = await persist(initial, revision);
      setRevision(out.progress_revision);
      if (out.progress_data.mode !== 'STANDARD') {
        setSaveError('保存失败：服务端返回了非 STANDARD 进度');
        return;
      }
      setProgressData(out.progress_data);
      setSaveError(null);
    } catch (e) {
      if (e instanceof ProgressRevisionConflictError) {
        const p = e.payload.progress_data;
        if (p.mode !== 'STANDARD') {
          setRevision(e.payload.progress_revision);
          setSaveError('保存失败：服务端返回了非 STANDARD 进度');
          return;
        }
        setProgressData(p);
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
  }, [questionnaireId, orderedIds, persist, phase, progressData, revision, saving]);

  const selectOption = useCallback(
    async (optionId: string | number) => {
      if (!progressData || phase !== 'ready' || saving) return;
      const ordered = progressData.standard.ordered_question_ids ?? orderedIds;
      if (progressData.standard.current_index >= ordered.length) return;

      const qid = ordered[progressData.standard.current_index];
      const next = applyStandardAnswer(progressData, qid, optionId);
      setProgressData(next);
      setSaveError(null);

      setSaving(true);
      setConflictNotice(false);
      try {
        const out = await persist(next, revision);
        setRevision(out.progress_revision);
        if (out.progress_data.mode !== 'STANDARD') {
          setSaveError('保存失败：服务端返回了非 STANDARD 进度');
          return;
        }
        setProgressData(out.progress_data);
        setSaveError(null);
      } catch (e) {
        if (e instanceof ProgressRevisionConflictError) {
          if (e.payload.progress_data.mode !== 'STANDARD') {
            setRevision(e.payload.progress_revision);
            setSaveError('保存失败：服务端返回了非 STANDARD 进度');
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
    [orderedIds, persist, phase, progressData, revision, saving],
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
    questionsMap,
    restart,
    selectOption,
  };
}
