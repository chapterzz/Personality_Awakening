/**
 * AVG 脚本公开消费服务（T4.7）：仅返回已发布脚本，组装 AvgScriptConfig 形状。
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AvgNodesJson = {
  start_node_id: string;
  backgrounds: Record<string, unknown>;
  nodes: Record<string, unknown>;
};

type AvgScriptRow = {
  id: string;
  title: string;
  nodesJson: unknown;
};

@Injectable()
export class AvgScriptService {
  constructor(private readonly prisma: PrismaService) {}

  private rowToConfig(row: AvgScriptRow): Record<string, unknown> {
    const nodesJson = row.nodesJson as AvgNodesJson;
    return {
      script_id: row.id,
      title: row.title,
      start_node_id: nodesJson.start_node_id,
      backgrounds: nodesJson.backgrounds,
      nodes: nodesJson.nodes,
    };
  }

  /**
   * 获取已发布 AVG 脚本；未发布或不存在时返回 null。
   */
  async getPublishedScript(id: string): Promise<Record<string, unknown> | null> {
    const row = await this.prisma.avgScript.findFirst({
      where: { id, isPublished: true },
    });
    if (!row) {
      return null;
    }
    return this.rowToConfig(row);
  }

  /**
   * 学生端当前生效脚本：取最近发布的已发布记录（唯一线上剧本）。
   */
  async getActivePublishedScript(): Promise<Record<string, unknown> | null> {
    const row = await this.prisma.avgScript.findFirst({
      where: { isPublished: true },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    });
    if (!row) {
      return null;
    }
    return this.rowToConfig(row);
  }

  /**
   * 获取已发布脚本；未发布则抛 404 envelope。
   */
  async getPublishedScriptOrThrow(id: string): Promise<Record<string, unknown>> {
    const data = await this.getPublishedScript(id);
    if (!data) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'avg_script_not_found',
      });
    }
    return data;
  }

  /**
   * 获取当前生效的已发布脚本；无任何已发布剧本时抛 404。
   */
  async getActivePublishedScriptOrThrow(): Promise<Record<string, unknown>> {
    const data = await this.getActivePublishedScript();
    if (!data) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'avg_script_none_published',
      });
    }
    return data;
  }
}
