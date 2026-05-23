/**
 * 标准题库 CMS 导入导出纯函数单元测试（Task 2）。
 */
import {
  parseQuestionnaireImportCsv,
  parseQuestionnaireImportJson,
  serializeQuestionnaireExportCsv,
  serializeQuestionnaireExportJson,
  validateQuestionnaireImportItems,
  type QuestionnaireImportItem,
} from './questionnaire-import-export';

const ITEM: QuestionnaireImportItem = {
  id: 'q1',
  title: 'Demo',
  questions: [
    {
      id: 'qq1',
      prompt: 'P',
      sort_order: 0,
      dimension: 'EI',
      group_tag: 'screening',
      group_sort_order: 0,
      options: [
        { id: 'o1', label: 'A', value_key: 'a', dimension: 'EI', side: 'E', weight: 2 },
        { id: 'o2', label: 'B', value_key: 'b', dimension: 'EI', side: 'I', weight: 2 },
      ],
    },
  ],
};

describe('questionnaire-import-export', () => {
  describe('parseQuestionnaireImportJson', () => {
    it('parses single-object JSON', () => {
      const payload = { schema_version: 1, ...ITEM };
      expect(parseQuestionnaireImportJson(JSON.stringify(payload))).toEqual([ITEM]);
    });

    it('parses bulk JSON with questionnaires array', () => {
      const payload = { schema_version: 1, questionnaires: [ITEM] };
      expect(parseQuestionnaireImportJson(JSON.stringify(payload))).toEqual([ITEM]);
    });

    it('rejects unsupported_schema_version', () => {
      expect(() => parseQuestionnaireImportJson('{"schema_version":2}')).toThrow(
        /unsupported_schema_version/,
      );
    });
  });

  describe('CSV round-trip', () => {
    it('round-trips via serializeQuestionnaireExportCsv', () => {
      const csv = serializeQuestionnaireExportCsv([ITEM]);
      expect(parseQuestionnaireImportCsv(csv)).toEqual([ITEM]);
    });
  });

  describe('parseQuestionnaireImportCsv', () => {
    it('throws inconsistent_questionnaire_title when titles differ', () => {
      const csv = serializeQuestionnaireExportCsv([
        ITEM,
        {
          ...ITEM,
          title: 'Other Title',
          questions: [{ ...ITEM.questions[0], id: 'qq2', sort_order: 1 }],
        },
      ]);
      expect(() => parseQuestionnaireImportCsv(csv)).toThrow(/inconsistent_questionnaire_title/);
    });
  });

  describe('serializeQuestionnaireExportJson', () => {
    it('exports single item with schema_version', () => {
      const json = serializeQuestionnaireExportJson([ITEM]);
      expect(json).toContain('\n');
      const parsed = JSON.parse(json) as Record<string, unknown>;
      expect(parsed.schema_version).toBe(1);
      expect(parsed.id).toBe('q1');
      expect(parsed).not.toHaveProperty('isPublished');
    });

    it('exports bulk with exported_at and questionnaires', () => {
      const json = serializeQuestionnaireExportJson(
        [ITEM, { ...ITEM, id: 'q2', title: 'Two' }],
        '2026-05-23T10:00:00.000Z',
      );
      const parsed = JSON.parse(json) as {
        schema_version: number;
        exported_at: string;
        questionnaires: QuestionnaireImportItem[];
      };
      expect(parsed.schema_version).toBe(1);
      expect(parsed.exported_at).toBe('2026-05-23T10:00:00.000Z');
      expect(parsed.questionnaires).toHaveLength(2);
      expect(parsed.questionnaires[0]).not.toHaveProperty('schema_version');
    });
  });

  describe('validateQuestionnaireImportItems', () => {
    it('catches invalid dimension on question', () => {
      const bad: QuestionnaireImportItem = {
        ...ITEM,
        questions: [{ ...ITEM.questions[0], dimension: 'XX' }],
      };
      const errors = validateQuestionnaireImportItems([bad]);
      expect(errors.some((e) => e.code === 'invalid_dimension')).toBe(true);
    });

    it('catches insufficient_options', () => {
      const bad: QuestionnaireImportItem = {
        ...ITEM,
        questions: [{ ...ITEM.questions[0], options: [ITEM.questions[0].options[0]] }],
      };
      const errors = validateQuestionnaireImportItems([bad]);
      expect(errors.some((e) => e.code === 'insufficient_options')).toBe(true);
    });
  });
});
