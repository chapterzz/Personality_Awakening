/**
 * 科普图书馆服务单测：筛选 where 构造与标签聚合（T4.1）。
 */
import { LibraryService } from './library.service';

describe('LibraryService', () => {
  const service = new LibraryService({} as never);

  describe('buildListWhere', () => {
    it('默认仅已发布', () => {
      expect(service.buildListWhere({})).toEqual({
        isPublished: true,
        publishedAt: { not: null },
      });
    });

    it('category 与 tag 组合为 AND', () => {
      expect(service.buildListWhere({ category: 'theory', tag: 'MBTI' })).toMatchObject({
        isPublished: true,
        category: 'theory',
        tags: { has: 'MBTI' },
      });
    });
  });

  describe('collectAvailableTags', () => {
    it('去重并排序标签', () => {
      const tags = service.collectAvailableTags([{ tags: ['B', 'A'] }, { tags: ['A', 'C'] }]);
      expect(tags).toEqual(['A', 'B', 'C']);
    });
  });
});
