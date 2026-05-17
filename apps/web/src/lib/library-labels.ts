/**
 * 科普图书馆展示文案：分类中文名等纯函数（可单测）。
 */
import type { LibraryCategory } from '@/lib/library-types';

const CATEGORY_LABELS: Record<LibraryCategory, string> = {
  theory: '基础理论',
  anti_label: '反标签',
  celebrity: '名人案例',
};

/** 伦理免责声明（列表 Hero / 详情页脚复用） */
export const LIBRARY_ETHICS_DISCLAIMER = '内容仅供科普与娱乐参考，不能替代专业心理评估或医疗诊断。';

/**
 * 返回分类中文展示名；未知值回退为原文。
 */
export function getCategoryLabel(category: LibraryCategory | string): string {
  return CATEGORY_LABELS[category as LibraryCategory] ?? category;
}

/** 全部分类 Tab 选项（含「全部」） */
export const LIBRARY_CATEGORY_TABS: Array<{ value: LibraryCategory | null; label: string }> = [
  { value: null, label: '全部' },
  { value: 'theory', label: '基础理论' },
  { value: 'anti_label', label: '反标签' },
  { value: 'celebrity', label: '名人案例' },
];
