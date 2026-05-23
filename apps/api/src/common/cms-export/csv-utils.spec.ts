/**
 * 标准题库 CSV 工具单元测试（CMS 导入导出 Task 1）。
 */
import {
  CSV_HEADERS,
  UTF8_BOM,
  parseQuestionnaireCsv,
  serializeQuestionnaireCsv,
} from './csv-utils';

const SAMPLE_ROWS = [
  {
    questionnaire_id: 'q1',
    questionnaire_title: 'T',
    question_id: 'qq1',
    prompt: 'P',
    sort_order: '0',
    dimension: 'EI',
    group_tag: 'screening',
    group_sort_order: '0',
    options_json:
      '[{"id":"o1","label":"A","value_key":"a","dimension":"EI","side":"E","weight":2},{"id":"o2","label":"B","value_key":"b","dimension":"EI","side":"I","weight":2}]',
  },
];

describe('csv-utils', () => {
  it('round-trips questionnaire rows with UTF-8 BOM for Excel', () => {
    const csv = serializeQuestionnaireCsv(SAMPLE_ROWS);
    expect(csv.startsWith(UTF8_BOM)).toBe(true);
    expect(csv.split('\n')[0]).toBe(`${UTF8_BOM}${CSV_HEADERS.join(',')}`);
    const parsed = parseQuestionnaireCsv(csv);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].questionnaire_id).toBe('q1');
    expect(JSON.parse(parsed[0].options_json)).toHaveLength(2);
  });

  it('parses CSV without BOM (legacy export files)', () => {
    const csv = serializeQuestionnaireCsv(SAMPLE_ROWS).slice(UTF8_BOM.length);
    expect(csv.startsWith(UTF8_BOM)).toBe(false);
    const parsed = parseQuestionnaireCsv(csv);
    expect(parsed[0].questionnaire_id).toBe('q1');
  });

  it('round-trips Chinese text in prompt and title', () => {
    const rows = [
      {
        ...SAMPLE_ROWS[0],
        questionnaire_title: '自适应 MBTI 演示问卷',
        prompt: '周末放松时，你更愿意？',
        options_json:
          '[{"id":"o1","label":"和朋友外出","value_key":"a","dimension":"EI","side":"E","weight":2},{"id":"o2","label":"独自看书","value_key":"b","dimension":"EI","side":"I","weight":2}]',
      },
    ];
    const parsed = parseQuestionnaireCsv(serializeQuestionnaireCsv(rows));
    expect(parsed[0].questionnaire_title).toBe('自适应 MBTI 演示问卷');
    expect(parsed[0].prompt).toBe('周末放松时，你更愿意？');
  });

  it('throws csv_row_error on bad options_json', () => {
    const bad = serializeQuestionnaireCsv([{ ...SAMPLE_ROWS[0], options_json: 'not-json' }]);
    expect(() => parseQuestionnaireCsv(bad)).toThrow(/csv_row_error/);
  });
});
