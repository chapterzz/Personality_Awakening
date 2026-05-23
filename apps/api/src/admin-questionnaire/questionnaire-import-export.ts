/**
 * 标准题库 CMS 导入导出：JSON/CSV 解析、序列化与校验（纯函数，Task 2）。
 */
import {
  parseQuestionnaireCsv,
  serializeQuestionnaireCsv,
  type QuestionnaireCsvRow,
} from '../common/cms-export/csv-utils';
import {
  QuestionnaireValidationError,
  validateOptionScoring,
  validateQuestionGroupFields,
} from '../questionnaire/questionnaire-validation';

/** 导入/导出用的问卷数据结构（JSON snake_case 与内存模型一致） */
export type QuestionnaireImportItem = {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    prompt: string;
    sort_order: number;
    dimension: string | null;
    group_tag: string | null;
    group_sort_order: number | null;
    options: Array<{
      id: string;
      label: string;
      value_key: string;
      dimension: string | null;
      side: string | null;
      weight: number | null;
    }>;
  }>;
};

/** 校验错误项：machine-readable code，可选 path / CSV 行号 */
export type ValidationErrorItem = { code: string; path?: string; row?: number };

const SCHEMA_VERSION = 1;

type ImportOption = QuestionnaireImportItem['questions'][0]['options'][0];
type ImportQuestion = QuestionnaireImportItem['questions'][0];

/**
 * 校验 JSON 根对象的 schema_version 须为 1。
 */
function assertSchemaVersion(value: unknown): void {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('schema_version' in value) ||
    (value as { schema_version: unknown }).schema_version !== SCHEMA_VERSION
  ) {
    throw new Error('unsupported_schema_version');
  }
}

/**
 * 将 JSON 字段转为可空字符串。
 */
function parseNullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value);
}

/**
 * 将 JSON 字段转为可空整数。
 */
function parseNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error('invalid_json');
  }
  return n;
}

/**
 * 从 JSON 对象解析单个选项（snake_case 字段）。
 */
function parseOptionFromJson(obj: unknown): ImportOption {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('invalid_json');
  }
  const o = obj as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.label !== 'string' || typeof o.value_key !== 'string') {
    throw new Error('invalid_json');
  }
  return {
    id: o.id,
    label: o.label,
    value_key: o.value_key,
    dimension: parseNullableString(o.dimension),
    side: parseNullableString(o.side),
    weight: parseNullableInt(o.weight),
  };
}

/**
 * 从 JSON 对象解析单道题目（snake_case 字段）。
 */
function parseQuestionFromJson(obj: unknown): ImportQuestion {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('invalid_json');
  }
  const q = obj as Record<string, unknown>;
  if (
    typeof q.id !== 'string' ||
    typeof q.prompt !== 'string' ||
    !Array.isArray(q.options) ||
    q.sort_order === undefined ||
    q.sort_order === null
  ) {
    throw new Error('invalid_json');
  }
  const sortOrder = Number(q.sort_order);
  if (!Number.isFinite(sortOrder)) {
    throw new Error('invalid_json');
  }
  return {
    id: q.id,
    prompt: q.prompt,
    sort_order: sortOrder,
    dimension: parseNullableString(q.dimension),
    group_tag: parseNullableString(q.group_tag),
    group_sort_order: parseNullableInt(q.group_sort_order),
    options: q.options.map(parseOptionFromJson),
  };
}

/**
 * 从 JSON 对象解析单个问卷（不含 schema_version）。
 */
function parseQuestionnaireFromJson(obj: unknown): QuestionnaireImportItem {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('invalid_json');
  }
  const o = obj as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.title !== 'string' || !Array.isArray(o.questions)) {
    throw new Error('invalid_json');
  }
  return {
    id: o.id,
    title: o.title,
    questions: o.questions.map(parseQuestionFromJson),
  };
}

/**
 * 解析标准题库 JSON 导入文件（单条或 bulk questionnaires 数组）。
 * @param text - UTF-8 JSON 文本
 * @returns 问卷数组
 * @throws unsupported_schema_version | invalid_json
 */
export function parseQuestionnaireImportJson(text: string): QuestionnaireImportItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('invalid_json');
  }

  assertSchemaVersion(parsed);
  const root = parsed as Record<string, unknown>;

  if (Array.isArray(root.questionnaires)) {
    return root.questionnaires.map(parseQuestionnaireFromJson);
  }

  if (typeof root.id === 'string' && typeof root.title === 'string') {
    return [parseQuestionnaireFromJson(parsed)];
  }

  throw new Error('invalid_json');
}

/**
 * 将 CSV 空字符串转为 null，否则保留原值。
 */
function csvNullableString(value: string): string | null {
  return value === '' ? null : value;
}

/**
 * 将 CSV 数字列转为整数；空字符串为 null。
 */
function csvNullableInt(value: string): number | null {
  if (value === '') {
    return null;
  }
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) {
    throw new Error('invalid_csv');
  }
  return n;
}

/**
 * 从 CSV 行解析单道题目（options_json 已在上游校验为 JSON 数组）。
 */
function parseQuestionFromCsvRow(row: QuestionnaireCsvRow): ImportQuestion {
  const optionsRaw = JSON.parse(row.options_json) as unknown[];
  const sortOrder = Number.parseInt(row.sort_order, 10);
  if (!Number.isFinite(sortOrder)) {
    throw new Error('invalid_csv');
  }
  return {
    id: row.question_id,
    prompt: row.prompt,
    sort_order: sortOrder,
    dimension: csvNullableString(row.dimension),
    group_tag: csvNullableString(row.group_tag),
    group_sort_order: csvNullableInt(row.group_sort_order),
    options: optionsRaw.map(parseOptionFromJson),
  };
}

/**
 * 解析标准题库 CSV 导入文件，按 questionnaire_id 聚合为问卷。
 * @param text - UTF-8 CSV 文本
 * @returns 问卷数组
 * @throws inconsistent_questionnaire_title | invalid_csv | csv_row_error
 */
export function parseQuestionnaireImportCsv(text: string): QuestionnaireImportItem[] {
  const rows = parseQuestionnaireCsv(text);
  const grouped = new Map<string, { title: string; rows: QuestionnaireCsvRow[] }>();

  for (const row of rows) {
    const existing = grouped.get(row.questionnaire_id);
    if (!existing) {
      grouped.set(row.questionnaire_id, { title: row.questionnaire_title, rows: [row] });
      continue;
    }
    if (existing.title !== row.questionnaire_title) {
      throw new Error('inconsistent_questionnaire_title');
    }
    existing.rows.push(row);
  }

  return Array.from(grouped.entries()).map(([id, { title, rows }]) => ({
    id,
    title,
    questions: rows.map(parseQuestionFromCsvRow),
  }));
}

/**
 * 将问卷对象序列化为 JSON 导出片段（snake_case，不含 schema_version）。
 */
function serializeQuestionnaireBody(item: QuestionnaireImportItem): Record<string, unknown> {
  return {
    id: item.id,
    title: item.title,
    questions: item.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      sort_order: q.sort_order,
      dimension: q.dimension,
      group_tag: q.group_tag,
      group_sort_order: q.group_sort_order,
      options: q.options.map((o) => ({
        id: o.id,
        label: o.label,
        value_key: o.value_key,
        dimension: o.dimension,
        side: o.side,
        weight: o.weight,
      })),
    })),
  };
}

/**
 * 序列化问卷为 JSON 导出文本。
 * 单条：含 schema_version 的单对象；多条：bulk 含 exported_at 与 questionnaires 数组。
 * @param items - 待导出问卷
 * @param exportedAt - bulk 导出时的 ISO 时间戳（默认当前时间）
 */
export function serializeQuestionnaireExportJson(
  items: QuestionnaireImportItem[],
  exportedAt?: string,
): string {
  if (items.length === 1) {
    return JSON.stringify(
      {
        schema_version: SCHEMA_VERSION,
        ...serializeQuestionnaireBody(items[0]),
      },
      null,
      2,
    );
  }

  return JSON.stringify(
    {
      schema_version: SCHEMA_VERSION,
      exported_at: exportedAt ?? new Date().toISOString(),
      questionnaires: items.map(serializeQuestionnaireBody),
    },
    null,
    2,
  );
}

/**
 * 序列化问卷为 CSV 导出文本（每行一题，options_json 嵌入选项数组）。
 */
export function serializeQuestionnaireExportCsv(items: QuestionnaireImportItem[]): string {
  const rows: QuestionnaireCsvRow[] = [];

  for (const item of items) {
    for (const q of item.questions) {
      rows.push({
        questionnaire_id: item.id,
        questionnaire_title: item.title,
        question_id: q.id,
        prompt: q.prompt,
        sort_order: String(q.sort_order),
        dimension: q.dimension ?? '',
        group_tag: q.group_tag ?? '',
        group_sort_order: q.group_sort_order === null ? '' : String(q.group_sort_order),
        options_json: JSON.stringify(
          q.options.map((o) => ({
            id: o.id,
            label: o.label,
            value_key: o.value_key,
            dimension: o.dimension,
            side: o.side,
            weight: o.weight,
          })),
        ),
      });
    }
  }

  return serializeQuestionnaireCsv(rows);
}

/**
 * 将 Prisma/Service 详情（camelCase）转为导入导出用的 snake_case 结构。
 */
export function questionnaireDetailToImportItem(detail: {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    prompt: string;
    sortOrder: number;
    dimension: string | null;
    groupTag: string | null;
    groupSortOrder: number | null;
    options: Array<{
      id: string;
      label: string;
      valueKey: string;
      dimension: string | null;
      side: string | null;
      weight: number | null;
    }>;
  }>;
}): QuestionnaireImportItem {
  return {
    id: detail.id,
    title: detail.title,
    questions: detail.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      sort_order: q.sortOrder,
      dimension: q.dimension,
      group_tag: q.groupTag,
      group_sort_order: q.groupSortOrder,
      options: q.options.map((o) => ({
        id: o.id,
        label: o.label,
        value_key: o.valueKey,
        dimension: o.dimension,
        side: o.side,
        weight: o.weight,
      })),
    })),
  };
}

/**
 * 校验导入问卷列表：题组字段、选项计分、每题至少 2 个选项。
 * @returns 校验错误列表（空数组表示通过）
 */
export function validateQuestionnaireImportItems(
  items: QuestionnaireImportItem[],
): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  items.forEach((item, itemIndex) => {
    item.questions.forEach((q, qIndex) => {
      const basePath = `questionnaires[${itemIndex}].questions[${qIndex}]`;

      if (q.options.length < 2) {
        errors.push({ code: 'insufficient_options', path: basePath });
      }

      try {
        validateQuestionGroupFields({
          dimension: q.dimension,
          groupTag: q.group_tag,
        });
      } catch (err) {
        if (err instanceof QuestionnaireValidationError) {
          errors.push({ code: err.code, path: basePath });
        } else {
          throw err;
        }
      }

      q.options.forEach((opt, optIndex) => {
        try {
          validateOptionScoring(opt);
        } catch (err) {
          if (err instanceof QuestionnaireValidationError) {
            errors.push({ code: err.code, path: `${basePath}.options[${optIndex}]` });
          } else {
            throw err;
          }
        }
      });
    });
  });

  return errors;
}
