/**
 * Admin AVG CMS DTO：更新 nodesJson。
 */
import { IsObject } from 'class-validator';

export class UpdateAvgNodesDto {
  @IsObject()
  nodesJson!: {
    start_node_id: string;
    backgrounds: Record<string, unknown>;
    nodes: Record<string, unknown>;
  };
}
