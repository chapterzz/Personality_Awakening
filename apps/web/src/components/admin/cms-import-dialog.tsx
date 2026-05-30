/**
 * Admin CMS 导入对话框：选文件 → dry_run 预览 → 冲突策略 → 正式导入。
 */
'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AdminImportExportError,
  commitAvgImport,
  commitQuestionnaireImport,
  detectQuestionnaireFormat,
  dryRunAvgImport,
  dryRunQuestionnaireImport,
  formatValidationErrors,
  type ImportCommitOptions,
  type ImportDryRunResult,
} from '@/lib/admin-import-export-api';
import { cn } from '@/lib/utils';

type CmsImportDialogProps = {
  kind: 'questionnaire' | 'avg';
  onSuccess: () => void;
};

type OnConflict = ImportCommitOptions['onConflict'];

type ModalPhase = 'preview' | 'success';

const CONFLICT_LABELS: Record<OnConflict, string> = {
  overwrite: '覆盖已有记录',
  create_new: '新建（追加 import 后缀）',
  cancel: '取消导入',
};

const AVG_OVERWRITE_WARNING =
  '覆盖已发布脚本且修改节点 id 可能导致进行中 AVG 会话 script_mismatch。';

/** CMS 导入入口与确认弹层 */
export function CmsImportDialog({ kind, onSuccess }: CmsImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [dryRun, setDryRun] = useState<ImportDryRunResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhase, setModalPhase] = useState<ModalPhase>('preview');
  const [onConflict, setOnConflict] = useState<OnConflict | null>(null);
  const [publishAfter, setPublishAfter] = useState(kind === 'avg');
  const [newIdSuffix, setNewIdSuffix] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const accept = kind === 'questionnaire' ? '.json,.csv' : '.json';
  const hasConflicts = (dryRun?.conflicts.length ?? 0) > 0;
  const countLabel = kind === 'questionnaire' ? 'question_count' : 'node_count';
  const countText = kind === 'questionnaire' ? '题' : '节点';

  function resetState() {
    setFile(null);
    setDryRun(null);
    setModalOpen(false);
    setModalPhase('preview');
    setOnConflict(null);
    setPublishAfter(kind === 'avg');
    setNewIdSuffix('');
    setError(null);
    setSuccessNote(null);
    setBusy(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  function closeModal() {
    resetState();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setError(null);
    setSuccessNote(null);

    let importFormat: 'json' | 'csv' = 'json';
    if (kind === 'questionnaire') {
      const detected = detectQuestionnaireFormat(selected);
      if (!detected) {
        setError('请选择 .json 或 .csv 文件');
        return;
      }
      importFormat = detected;
    }

    setFile(selected);
    setFormat(importFormat);
    setBusy(true);

    try {
      const result =
        kind === 'questionnaire'
          ? await dryRunQuestionnaireImport(selected, importFormat)
          : await dryRunAvgImport(selected);

      setDryRun(result);
      setOnConflict(result.conflicts.length > 0 ? null : 'cancel');
      setModalPhase('preview');
      setModalOpen(true);
    } catch (err: unknown) {
      setError(formatImportError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!file || !dryRun) return;

    if (hasConflicts && !onConflict) {
      setError('存在 ID 冲突，请选择处理策略');
      return;
    }

    setBusy(true);
    setError(null);

    const options: ImportCommitOptions = {
      onConflict: onConflict ?? 'cancel',
      publishAfter,
      newIdSuffix: newIdSuffix.trim() || undefined,
    };

    try {
      const result =
        kind === 'questionnaire'
          ? await commitQuestionnaireImport(file, format, options)
          : await commitAvgImport(file, options);

      const overwrote = dryRun.conflicts.some(
        (c) => onConflict === 'overwrite' && result.imported.some((row) => row.id === c.id),
      );

      if (kind === 'avg' && onConflict === 'overwrite' && overwrote) {
        setSuccessNote(AVG_OVERWRITE_WARNING);
      } else {
        setSuccessNote(`已成功导入 ${result.imported.length} 条记录`);
      }

      setModalPhase('success');
      onSuccess();
    } catch (err: unknown) {
      setError(formatImportError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy && !modalOpen ? '解析中…' : '导入'}
      </Button>

      {error && !modalOpen ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {modalOpen && dryRun ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className={cn(
              'max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl',
              'border-2 border-[var(--border)] bg-card p-5 shadow-clay',
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cms-import-title"
          >
            <h2 id="cms-import-title" className="font-display text-lg font-bold">
              {modalPhase === 'success' ? '导入完成' : '确认导入'}
            </h2>

            {modalPhase === 'success' ? (
              <div className="mt-4 space-y-4">
                {successNote ? (
                  <p
                    className={cn(
                      'rounded-xl px-3 py-2 text-sm',
                      successNote === AVG_OVERWRITE_WARNING
                        ? 'border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100'
                        : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
                    )}
                  >
                    {successNote}
                  </p>
                ) : null}
                <div className="flex justify-end">
                  <Button type="button" onClick={closeModal}>
                    关闭
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  文件：<span className="font-mono text-xs">{file?.name}</span>
                  {kind === 'questionnaire' ? (
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs uppercase">
                      {format}
                    </span>
                  ) : null}
                </p>

                <div className="rounded-xl border border-[var(--border)] bg-muted/30 px-3 py-2 text-sm">
                  <p>
                    共 <strong>{dryRun.preview.count}</strong> 条待导入
                  </p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs">
                    {dryRun.preview.items.map((item) => (
                      <li key={item.id} className="font-mono">
                        {item.id} — {item.title}
                        {item[countLabel] != null ? `（${item[countLabel]} ${countText}）` : null}
                      </li>
                    ))}
                  </ul>
                </div>

                {hasConflicts ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      检测到 {dryRun.conflicts.length} 个 ID 冲突
                    </p>
                    <ul className="max-h-24 overflow-y-auto rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
                      {dryRun.conflicts.map((c) => (
                        <li key={c.id} className="font-mono">
                          {c.id}
                          {c.existing_title ? `（已有：${c.existing_title}）` : null}
                        </li>
                      ))}
                    </ul>
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium">冲突处理策略 *</legend>
                      {(Object.keys(CONFLICT_LABELS) as OnConflict[]).map((value) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="radio"
                            name="on_conflict"
                            value={value}
                            checked={onConflict === value}
                            onChange={() => setOnConflict(value)}
                          />
                          {CONFLICT_LABELS[value]}
                        </label>
                      ))}
                    </fieldset>
                    {onConflict === 'create_new' ? (
                      <label className="block text-sm">
                        <span className="text-muted-foreground">
                          新 ID 后缀（可选，留空由服务端生成）
                        </span>
                        <input
                          type="text"
                          className="mt-1 w-full rounded-xl border-2 border-[var(--border)] bg-background px-3 py-2 text-sm"
                          value={newIdSuffix}
                          onChange={(e) => setNewIdSuffix(e.target.value)}
                          placeholder="例如 abc123"
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}

                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={publishAfter}
                    onChange={(e) => setPublishAfter(e.target.checked)}
                  />
                  导入后立即发布
                </label>

                {error ? (
                  <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" disabled={busy} onClick={closeModal}>
                    取消
                  </Button>
                  <Button type="button" disabled={busy} onClick={() => void handleConfirm()}>
                    {busy ? '导入中…' : '确认导入'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function formatImportError(err: unknown): string {
  if (err instanceof AdminImportExportError) {
    if (err.validationErrors.length > 0) {
      return `${err.message}：${formatValidationErrors(err.validationErrors)}`;
    }
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'import_failed';
}
