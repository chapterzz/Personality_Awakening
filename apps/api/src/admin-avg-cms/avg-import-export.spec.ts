/**
 * AVG 脚本 CMS 导入导出纯函数单元测试（Task 4）。
 */
import {
  parseAvgImportJson,
  serializeAvgExportJson,
  validateAvgImportItems,
  type AvgImportItem,
} from './avg-import-export';

/** 最小合法脚本，供正向用例复用 */
function minimalValidItem(): AvgImportItem {
  return {
    id: 'demo-avg-v1',
    title: 'Demo',
    start_node_id: 'intro',
    backgrounds: { night: 'from-slate-900 to-slate-950' },
    nodes: {
      intro: {
        kind: 'dialogue',
        background_key: 'night',
        lines: [{ speaker: 'narrator', text: 'hello' }],
        next_id: 'choice',
      },
      choice: {
        kind: 'choice',
        background_key: 'night',
        lines: [{ speaker: 'narrator', text: 'pick' }],
        options: [
          { id: 'a', label: 'A', next_id: 'end' },
          { id: 'b', label: 'B', next_id: 'end' },
        ],
      },
      end: {
        kind: 'end',
        background_key: 'night',
        lines: [{ speaker: 'narrator', text: 'bye' }],
      },
    },
  };
}

describe('avg-import-export', () => {
  describe('parseAvgImportJson', () => {
    it('parses single-object JSON', () => {
      const item = minimalValidItem();
      const payload = { schema_version: 1, ...item };
      expect(parseAvgImportJson(JSON.stringify(payload))).toEqual([item]);
    });

    it('parses bulk JSON with scripts array', () => {
      const item = minimalValidItem();
      const payload = { schema_version: 1, scripts: [item] };
      expect(parseAvgImportJson(JSON.stringify(payload))).toEqual([item]);
    });

    it('rejects unsupported_schema_version', () => {
      expect(() => parseAvgImportJson('{"schema_version":2}')).toThrow(
        /unsupported_schema_version/,
      );
    });
  });

  describe('serializeAvgExportJson round-trip', () => {
    it('round-trips single item via serializeAvgExportJson', () => {
      const item = minimalValidItem();
      const json = serializeAvgExportJson([item]);
      expect(parseAvgImportJson(json)).toEqual([item]);
    });

    it('round-trips bulk export via serializeAvgExportJson', () => {
      const item = minimalValidItem();
      const second = { ...item, id: 'demo-avg-v2', title: 'Two' };
      const json = serializeAvgExportJson([item, second], '2026-05-23T10:00:00.000Z');
      expect(parseAvgImportJson(json)).toEqual([item, second]);
    });

    it('exports single item with schema_version', () => {
      const item = minimalValidItem();
      const json = serializeAvgExportJson([item]);
      expect(json).toContain('\n');
      const parsed = JSON.parse(json) as Record<string, unknown>;
      expect(parsed.schema_version).toBe(1);
      expect(parsed.id).toBe('demo-avg-v1');
      expect(parsed).not.toHaveProperty('isPublished');
    });

    it('exports bulk with exported_at and scripts', () => {
      const item = minimalValidItem();
      const json = serializeAvgExportJson(
        [item, { ...item, id: 'demo-avg-v2', title: 'Two' }],
        '2026-05-23T10:00:00.000Z',
      );
      const parsed = JSON.parse(json) as {
        schema_version: number;
        exported_at: string;
        scripts: AvgImportItem[];
      };
      expect(parsed.schema_version).toBe(1);
      expect(parsed.exported_at).toBe('2026-05-23T10:00:00.000Z');
      expect(parsed.scripts).toHaveLength(2);
      expect(parsed.scripts[0]).not.toHaveProperty('schema_version');
    });
  });

  describe('validateAvgImportItems', () => {
    it('catches invalid nodes', () => {
      const bad: AvgImportItem = {
        ...minimalValidItem(),
        start_node_id: 'ghost',
      };
      const errors = validateAvgImportItems([bad]);
      expect(errors.some((e) => e.code === 'start_node_id_not_found')).toBe(true);
    });
  });
});
