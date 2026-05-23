/**
 * CMS 导入 ID 冲突解析单元测试（CMS 导入导出 Task 1）。
 */
import { resolveImportIds } from './import-conflict';

describe('resolveImportIds', () => {
  it('returns same ids when no conflict', () => {
    const existing = new Set(['other']);
    const result = resolveImportIds(['a', 'b'], existing, 'overwrite', 'abc123');
    expect(result.conflicts).toEqual([]);
    expect(result.targetIds).toEqual(['a', 'b']);
  });

  it('returns empty targetIds on cancel with conflict', () => {
    const existing = new Set(['a']);
    const result = resolveImportIds(['a', 'b'], existing, 'cancel', 'abc123');
    expect(result.conflicts).toEqual([{ id: 'a' }]);
    expect(result.targetIds).toEqual([]);
  });

  it('appends import suffix on create_new', () => {
    const existing = new Set(['a']);
    const result = resolveImportIds(['a', 'b'], existing, 'create_new', 'xyz');
    expect(result.targetIds).toEqual(['a-import-xyz', 'b']);
    expect(result.conflicts).toEqual([{ id: 'a' }]);
  });

  it('keeps same id on overwrite', () => {
    const existing = new Set(['a']);
    const result = resolveImportIds(['a'], existing, 'overwrite', 'xyz');
    expect(result.targetIds).toEqual(['a']);
    expect(result.conflicts).toEqual([{ id: 'a' }]);
  });
});
