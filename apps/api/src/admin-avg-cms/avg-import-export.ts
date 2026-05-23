/**
 * AVG 脚本 CMS 导入导出：JSON 解析、序列化与校验（纯函数，Task 4）。
 */
import {
  AvgScriptValidationError,
  validateAvgNodesJson,
} from '../avg-script/avg-script-validation';

/** 导入/导出用的 AVG 脚本结构（JSON snake_case 与内存模型一致） */
export type AvgImportItem = {
  id: string;
  title: string;
  start_node_id: string;
  backgrounds: Record<string, unknown>;
  nodes: Record<string, unknown>;
};

const SCHEMA_VERSION = 1;

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
 * 将 JSON 字段转为对象 Record。
 */
function parseObjectRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('invalid_json');
  }
  return value as Record<string, unknown>;
}

/**
 * 从 JSON 对象解析单个 AVG 脚本（不含 schema_version）。
 */
function parseScriptFromJson(obj: unknown): AvgImportItem {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('invalid_json');
  }
  const o = obj as Record<string, unknown>;
  if (
    typeof o.id !== 'string' ||
    typeof o.title !== 'string' ||
    typeof o.start_node_id !== 'string'
  ) {
    throw new Error('invalid_json');
  }
  return {
    id: o.id,
    title: o.title,
    start_node_id: o.start_node_id,
    backgrounds: parseObjectRecord(o.backgrounds ?? {}),
    nodes: parseObjectRecord(o.nodes ?? {}),
  };
}

/**
 * 解析 AVG JSON 导入文件（单条或 bulk scripts 数组）。
 * @param text - UTF-8 JSON 文本
 * @returns 脚本数组
 * @throws unsupported_schema_version | invalid_json
 */
export function parseAvgImportJson(text: string): AvgImportItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('invalid_json');
  }

  assertSchemaVersion(parsed);
  const root = parsed as Record<string, unknown>;

  if (Array.isArray(root.scripts)) {
    return root.scripts.map(parseScriptFromJson);
  }

  if (
    typeof root.id === 'string' &&
    typeof root.title === 'string' &&
    typeof root.start_node_id === 'string'
  ) {
    return [parseScriptFromJson(parsed)];
  }

  throw new Error('invalid_json');
}

/**
 * 将脚本对象序列化为 JSON 导出片段（snake_case，不含 schema_version）。
 */
function serializeScriptBody(item: AvgImportItem): Record<string, unknown> {
  return {
    id: item.id,
    title: item.title,
    start_node_id: item.start_node_id,
    backgrounds: item.backgrounds,
    nodes: item.nodes,
  };
}

/**
 * 序列化 AVG 脚本为 JSON 导出文本。
 * 单条：含 schema_version 的单对象；多条：bulk 含 exported_at 与 scripts 数组。
 * @param items - 待导出脚本
 * @param exportedAt - bulk 导出时的 ISO 时间戳（默认当前时间）
 */
export function serializeAvgExportJson(items: AvgImportItem[], exportedAt?: string): string {
  if (items.length === 1) {
    return JSON.stringify(
      {
        schema_version: SCHEMA_VERSION,
        ...serializeScriptBody(items[0]),
      },
      null,
      2,
    );
  }

  return JSON.stringify(
    {
      schema_version: SCHEMA_VERSION,
      exported_at: exportedAt ?? new Date().toISOString(),
      scripts: items.map(serializeScriptBody),
    },
    null,
    2,
  );
}

/**
 * 将 Prisma/Service 行（camelCase nodesJson）转为导入导出用的 snake_case 结构。
 */
export function avgScriptRowToImportItem(row: {
  id: string;
  title: string;
  nodesJson: unknown;
}): AvgImportItem {
  const nodesJson = parseObjectRecord(row.nodesJson);
  const startNodeId = typeof nodesJson.start_node_id === 'string' ? nodesJson.start_node_id : '';
  return {
    id: row.id,
    title: row.title,
    start_node_id: startNodeId,
    backgrounds: parseObjectRecord(nodesJson.backgrounds ?? {}),
    nodes: parseObjectRecord(nodesJson.nodes ?? {}),
  };
}

/**
 * 将导入项转为数据库存储用的 nodesJson 结构。
 */
export function avgImportItemToNodesJson(item: AvgImportItem): {
  start_node_id: string;
  backgrounds: Record<string, unknown>;
  nodes: Record<string, unknown>;
} {
  return {
    start_node_id: item.start_node_id,
    backgrounds: item.backgrounds,
    nodes: item.nodes,
  };
}

/**
 * 校验导入 AVG 脚本列表：复用 validateAvgNodesJson。
 * @returns 校验错误列表（空数组表示通过）
 */
export function validateAvgImportItems(
  items: AvgImportItem[],
): Array<{ code: string; path?: string }> {
  const errors: Array<{ code: string; path?: string }> = [];

  items.forEach((item, itemIndex) => {
    const basePath = items.length === 1 ? '' : `scripts[${itemIndex}]`;
    try {
      validateAvgNodesJson(avgImportItemToNodesJson(item));
    } catch (err) {
      if (err instanceof AvgScriptValidationError) {
        errors.push({
          code: err.code,
          path: basePath || undefined,
        });
      } else {
        throw err;
      }
    }
  });

  return errors;
}
