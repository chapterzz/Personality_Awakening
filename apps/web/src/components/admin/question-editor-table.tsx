/**
 * Admin 题目与选项编辑表格（行内编辑，T4.6）。
 */
'use client';

import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import {
  deleteQuestion,
  updateOption,
  updateQuestionMeta,
  updateQuestionPrompt,
  type AdminQuestion,
} from '@/lib/admin-api';
import { cn } from '@/lib/utils';

const inputClass =
  'w-full min-w-[8rem] rounded-lg border border-[var(--border)] bg-background px-2 py-1 text-xs';

type QuestionEditorTableProps = {
  questionnaireId: string;
  questions: AdminQuestion[];
  onSaved: () => void | Promise<void>;
};

export function QuestionEditorTable({
  questionnaireId,
  questions,
  onSaved,
}: QuestionEditorTableProps) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSave(key: string, fn: () => Promise<void>) {
    setPendingKey(key);
    setError(null);
    try {
      await fn();
      await onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'save_failed');
    } finally {
      setPendingKey(null);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (
      !window.confirm(
        '硬删此题将同时删除其选项，且不可恢复。进行中的测评若引用此题可能异常。确认删除？',
      )
    ) {
      return;
    }
    await runSave(`del-${questionId}`, () => deleteQuestion(questionnaireId, questionId));
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border-2 border-[var(--border)] bg-card shadow-clay-sm">
        <table className="min-w-[960px] w-full text-left text-xs">
          <thead className="border-b border-[var(--border)] bg-muted/40">
            <tr>
              <th className="px-3 py-2">题 ID</th>
              <th className="px-3 py-2">题干</th>
              <th className="px-3 py-2">groupTag</th>
              <th className="px-3 py-2">dimension</th>
              <th className="px-3 py-2">选项</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <QuestionRow
                key={q.id}
                questionnaireId={questionnaireId}
                question={q}
                pendingKey={pendingKey}
                onSave={runSave}
                onDelete={() => void handleDeleteQuestion(q.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type QuestionRowProps = {
  questionnaireId: string;
  question: AdminQuestion;
  pendingKey: string | null;
  onSave: (key: string, fn: () => Promise<void>) => Promise<void>;
  onDelete: () => void;
};

function QuestionRow({
  questionnaireId,
  question,
  pendingKey,
  onSave,
  onDelete,
}: QuestionRowProps) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [groupTag, setGroupTag] = useState(question.groupTag ?? '');
  const [dimension, setDimension] = useState(question.dimension ?? '');

  return (
    <tr className="border-b border-[var(--border)] align-top last:border-0">
      <td className="px-3 py-2 font-mono">{question.id}</td>
      <td className="px-3 py-2">
        <textarea
          className={cn(inputClass, 'min-h-[4rem]')}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          type="button"
          disabled={pendingKey === `prompt-${question.id}`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mt-1')}
          onClick={() =>
            void onSave(`prompt-${question.id}`, () =>
              updateQuestionPrompt(questionnaireId, question.id, prompt),
            )
          }
        >
          保存题干
        </button>
      </td>
      <td className="px-3 py-2">
        <input
          className={inputClass}
          value={groupTag}
          onChange={(e) => setGroupTag(e.target.value)}
        />
        <button
          type="button"
          disabled={pendingKey === `meta-${question.id}`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mt-1')}
          onClick={() =>
            void onSave(`meta-${question.id}`, () =>
              updateQuestionMeta(questionnaireId, question.id, {
                groupTag: groupTag || null,
                dimension: dimension || null,
              }),
            )
          }
        >
          保存分组
        </button>
      </td>
      <td className="px-3 py-2">
        <input
          className={inputClass}
          value={dimension}
          onChange={(e) => setDimension(e.target.value)}
        />
      </td>
      <td className="px-3 py-2">
        <ul className="space-y-2">
          {question.options.map((opt) => (
            <OptionEditor key={opt.id} option={opt} pendingKey={pendingKey} onSave={onSave} />
          ))}
        </ul>
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-red-700')}
          onClick={onDelete}
        >
          删除题目
        </button>
      </td>
    </tr>
  );
}

type OptionEditorProps = {
  option: AdminQuestion['options'][number];
  pendingKey: string | null;
  onSave: (key: string, fn: () => Promise<void>) => Promise<void>;
};

function OptionEditor({ option, pendingKey, onSave }: OptionEditorProps) {
  const [label, setLabel] = useState(option.label);
  const [side, setSide] = useState(option.side ?? '');
  const [weight, setWeight] = useState(String(option.weight ?? ''));

  return (
    <li className="rounded-lg border border-[var(--border)] p-2">
      <p className="font-mono text-[10px] text-muted-foreground">{option.id}</p>
      <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} />
      <div className="mt-1 flex gap-1">
        <input
          className={cn(inputClass, 'w-12')}
          placeholder="side"
          value={side}
          onChange={(e) => setSide(e.target.value)}
        />
        <input
          className={cn(inputClass, 'w-12')}
          placeholder="wt"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <button
          type="button"
          disabled={pendingKey === `opt-${option.id}`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'px-2')}
          onClick={() =>
            void onSave(`opt-${option.id}`, () =>
              updateOption(option.id, {
                label,
                side: side || null,
                weight: weight ? Number(weight) : null,
              }),
            )
          }
        >
          保存
        </button>
      </div>
    </li>
  );
}
