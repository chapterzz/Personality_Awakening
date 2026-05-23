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

@Injectable()
export class AvgScriptService {
  constructor(private readonly prisma: PrismaService) {}

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
    const nodesJson = row.nodesJson as AvgNodesJson;
    return {
      script_id: row.id,
      start_node_id: nodesJson.start_node_id,
      backgrounds: nodesJson.backgrounds,
      nodes: nodesJson.nodes,
    };
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
}
