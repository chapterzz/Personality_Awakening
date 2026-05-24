/**
 * 标准模式随机 48 题测评 hook：从服务端获取问卷结构与题序，支持重新开始时 shuffle/reuse。
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
  QuestionnaireApiError,
  type ApiQuestionnaireData,
  type SequenceStrategy,
} from '@/lib/questionnaire-api';

export type RandomStandardTestPhase = 'loading' | 'ready' | 'error';

export type UseRandomStandardTestResult = {
  phase: RandomStandardTestPhase;
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
  questionsMap: Record<string, QuestionnaireQuestion>;
  restart: (strategy: SequenceStrategy) => Promise<void>;
  selectOption: (optionId: string | number) => Promise<void>;
};

export function useRandomStandardTest(questionnaireId: string): UseRandomStandardTestResult {
  const [phase, setPhase] = useState<RandomStandardTestPhase>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [progressData, setProgressData] = useState<StandardProgressDataV1 | null>(null);
  const [saving, setSaving] = useState(false);
  const [conflictNotice, setConflictNotice] = useState(false);
  const [authMode, setAuthMode] = useState<'guest' | 'user'>('guest');
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const [questionsMap, setQuestionsMap] = useState<Record<string, QuestionnaireQuestion>>({});

  const revisionRef = useRef(revision);
  useEffect(() => {
    revisionRef.current = revision;
  }, [revision]);

  const clearSaveError = useCallback(() => setSaveError(null), []);

  const reload = useCallback(() => {
    setLoadError(null);
    setSaveError(null);
    setPhase('loading');
    setLoadKey((k) => k + 1);
  }, []);

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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const questionnairePromise = fetchQuestionnaire(questionnaireId);
        const token = getAccessToken();
        const mode: 'guest' | 'user' = token ? 'user' : 'guest';
        const sid = token ? null : getOrCreateGuestSessionId();
        if (cancelled) return;
        setAuthMode(mode);
        setGuestSessionId(sid);

        const questionnaireData = await questionnairePromise;
        if (cancelled) return;
        setQuestionsMap(toQuestionsMap(questionnaireData));

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
            const seqData = await fetchQuestionSequence(questionnaireId, { strategy: 'shuffle' });
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
        if (e instanceof QuestionnaireApiError && e.status === 400) {
          setLoadError('题库配置不足，请联系管理员');
          setPhase('error');
          return;
        }
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

  const restart = useCallback(
    async (strategy: SequenceStrategy) => {
      if (phase !== 'ready' || saving) return;
      const current = progressData;
      if (!current) return;

      let initialIds: string[];
      try {
        const seqData = await fetchQuestionSequence(questionnaireId, {
          strategy,
          previousOrderedQuestionIds:
            strategy === 'reuse'
              ? (current.standard.ordered_question_ids ?? orderedIds)
              : undefined,
        });
        initialIds = seqData.ordered_question_ids;
      } catch {
        if (strategy === 'reuse') {
          initialIds = current.standard.ordered_question_ids ?? orderedIds;
        } else {
          setSaveError('获取新题序失败，请稍后重试');
          return;
        }
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
    },
    [questionnaireId, orderedIds, persist, phase, progressData, revision, saving],
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

      setSaving(true);
      setConflictNotice(false);
      try {
        const out = await persist(next, revisionRef.current);
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
    [orderedIds, persist, phase, progressData, saving],
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
