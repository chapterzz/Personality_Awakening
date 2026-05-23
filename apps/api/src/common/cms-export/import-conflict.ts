/**
 * CMS 导入 ID 冲突解析：覆盖 / 新建 / 取消三种策略下的目标 ID 映射。
 */
export type OnConflict = 'overwrite' | 'create_new' | 'cancel';

/**
 * 根据冲突策略将 incoming ID 映射为目标写入 ID，并收集冲突列表。
 * @param incomingIds - 待导入的 ID 列表
 * @param existingIds - 数据库中已存在的 ID 集合
 * @param onConflict - 冲突处理策略
 * @param newIdSuffix - create_new 时追加的后缀（格式 `{id}-import-{suffix}`）
 * @returns targetIds 与 conflicts；cancel 且存在冲突时 targetIds 为空数组
 */
export function resolveImportIds(
  incomingIds: string[],
  existingIds: Set<string>,
  onConflict: OnConflict,
  newIdSuffix: string,
): { targetIds: string[]; conflicts: Array<{ id: string }> } {
  const conflicts = incomingIds.filter((id) => existingIds.has(id)).map((id) => ({ id }));

  if (onConflict === 'cancel' && conflicts.length > 0) {
    return { targetIds: [], conflicts };
  }

  const targetIds = incomingIds.map((id) => {
    if (!existingIds.has(id)) {
      return id;
    }
    if (onConflict === 'create_new') {
      return `${id}-import-${newIdSuffix}`;
    }
    return id;
  });

  return { targetIds, conflicts };
}
