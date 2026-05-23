/**
 * 标准题库 CSV 导入导出工具：RFC4180 序列化/解析与 options_json 行校验。
 */
/** UTF-8 BOM：便于 Excel（Windows）双击打开时识别为 UTF-8，避免中文乱码 */
export const UTF8_BOM = '\uFEFF';

export const CSV_HEADERS = [
  'questionnaire_id',
  'questionnaire_title',
  'question_id',
  'prompt',
  'sort_order',
  'dimension',
  'group_tag',
  'group_sort_order',
  'options_json',
] as const;

export type QuestionnaireCsvRow = Record<(typeof CSV_HEADERS)[number], string>;

/**
 * RFC4180 最小转义：含逗号、双引号或换行时用双引号包裹，内部双引号加倍。
 */
export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 将问卷 CSV 行序列化为 UTF-8 文本（BOM + 首行表头 + 数据行）。
 */
export function serializeQuestionnaireCsv(rows: QuestionnaireCsvRow[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rows) {
    lines.push(CSV_HEADERS.map((h) => escapeCsvField(row[h] ?? '')).join(','));
  }
  return `${UTF8_BOM}${lines.join('\n')}`;
}

/**
 * 去掉文本开头的 UTF-8 BOM（导入兼容带/不带 BOM 的文件）。
 */
export function stripUtf8Bom(text: string): string {
  return text.startsWith(UTF8_BOM) ? text.slice(UTF8_BOM.length) : text;
}

/**
 * 解析问卷 CSV 文本，校验表头与每行字段完整，并验证 options_json 为合法 JSON 数组。
 * @param text - 完整 CSV 文本
 * @returns 解析后的行对象数组
 * @throws 表头不匹配、缺列或 options_json 非法时抛出含 csv_row_error 的错误（行号为 1-based 数据行）
 */
export function parseQuestionnaireCsv(text: string): QuestionnaireCsvRow[] {
  const records = parseCsvRecords(stripUtf8Bom(text));
  if (records.length === 0) {
    throw new Error('invalid_csv');
  }

  const headers = records[0];
  if (
    headers.length !== CSV_HEADERS.length ||
    !CSV_HEADERS.every((header, index) => headers[index] === header)
  ) {
    throw new Error('invalid_csv');
  }

  const rows: QuestionnaireCsvRow[] = [];
  for (let i = 1; i < records.length; i++) {
    const dataRowNumber = i;
    const fields = records[i];

    if (fields.length !== CSV_HEADERS.length) {
      throw new Error(`csv_row_error:row=${dataRowNumber}`);
    }

    const row = {} as QuestionnaireCsvRow;
    for (let col = 0; col < CSV_HEADERS.length; col++) {
      row[CSV_HEADERS[col]] = fields[col];
    }

    validateOptionsJson(row.options_json, dataRowNumber);
    rows.push(row);
  }

  return rows;
}

/**
 * 校验 options_json 可解析为 JSON 数组。
 */
function validateOptionsJson(value: string, dataRowNumber: number): void {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new Error(`csv_row_error:row=${dataRowNumber}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('csv_row_error')) {
      throw error;
    }
    throw new Error(`csv_row_error:row=${dataRowNumber}`);
  }
}

/**
 * 将 CSV 文本解析为字段二维数组（RFC4180 最小实现）。
 */
function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      currentRecord.push(currentField);
      currentField = '';
    } else if (char === '\n') {
      currentRecord.push(currentField);
      currentField = '';
      records.push(currentRecord);
      currentRecord = [];
    } else if (char === '\r') {
      if (nextChar === '\n') {
        i++;
      }
      currentRecord.push(currentField);
      currentField = '';
      records.push(currentRecord);
      currentRecord = [];
    } else {
      currentField += char;
    }
  }

  if (inQuotes) {
    throw new Error('invalid_csv');
  }

  if (currentField !== '' || currentRecord.length > 0) {
    currentRecord.push(currentField);
    records.push(currentRecord);
  }

  return records;
}
