/**
 * Admin AVG / 精灵文案 CMS 服务（T4.7）：CRUD、校验、发布/下架。
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AvgScriptValidationError,
  validateAvgNodesJson,
} from '../avg-script/avg-script-validation';
import { OnConflict, resolveImportIds } from '../common/cms-export/import-conflict';
import { PrismaService } from '../prisma/prisma.service';
import {
  SpritePromptValidationError,
  validateSpritePromptPayload,
} from '../sprite-prompt/sprite-prompt-validation';
import {
  avgImportItemToNodesJson,
  avgScriptRowToImportItem,
  AvgImportItem,
  parseAvgImportJson,
  serializeAvgExportJson,
  validateAvgImportItems,
} from './avg-import-export';
import { CreateAvgScriptDto, UpdateAvgScriptDto } from './dto/avg-script.dto';
import { ImportAvgScriptQueryDto } from './dto/import-avg-script.dto';
import { UpdateAvgNodesDto } from './dto/update-avg-nodes.dto';
import { UpdateSpritePromptDto } from './dto/update-sprite-prompt.dto';

@Injectable()
export class AdminAvgCmsService {
  constructor(private readonly prisma: PrismaService) {}

  private avgValidationToBadRequest(err: AvgScriptValidationError): never {
    throw new BadRequestException({
      success: false,
      data: null,
      message: err.code,
    });
  }

  private spriteValidationToBadRequest(err: SpritePromptValidationError): never {
    throw new BadRequestException({
      success: false,
      data: null,
      message: err.code,
    });
  }

  /** 导出单条 AVG 脚本为 JSON 文件内容 */
  async exportAvgScript(
    id: string,
  ): Promise<{ body: string; filename: string; contentType: string }> {
    const row = await this.getAvgScript(id);
    const item = avgScriptRowToImportItem(row);
    return {
      body: serializeAvgExportJson([item]),
      filename: `avg-script-${id}.json`,
      contentType: 'application/json; charset=utf-8',
    };
  }

  /** 导出全部 AVG 脚本为单文件 JSON */
  async exportAllAvgScripts(): Promise<{ body: string; filename: string; contentType: string }> {
    const rows = await this.prisma.avgScript.findMany({ orderBy: { id: 'asc' } });
    const items = rows.map((row) => avgScriptRowToImportItem(row));
    const date = new Date().toISOString().slice(0, 10);
    return {
      body: serializeAvgExportJson(items),
      filename: `avg-scripts-all-${date}.json`,
      contentType: 'application/json; charset=utf-8',
    };
  }

  /** 导入 AVG 脚本：解析、校验、冲突处理与可选发布 */
  async importAvgScripts(fileBuffer: Buffer, opts: ImportAvgScriptQueryDto) {
    const text = fileBuffer.toString('utf-8');
    const items = this.parseImportJson(text);

    const validationErrors = validateAvgImportItems(items);
    if (validationErrors.length > 0) {
      throw new BadRequestException({
        success: false,
        data: { validation_errors: validationErrors },
        message: 'validation_failed',
      });
    }

    const incomingIds = items.map((item) => item.id);
    const existingRows = await this.prisma.avgScript.findMany({
      where: { id: { in: incomingIds } },
      select: { id: true, title: true, isPublished: true },
    });
    const existingIds = new Set(existingRows.map((row) => row.id));
    const titleById = new Map(existingRows.map((row) => [row.id, row.title]));
    const wasPublishedById = new Map(existingRows.map((row) => [row.id, row.isPublished]));

    const onConflict: OnConflict = opts.on_conflict ?? 'cancel';
    const newIdSuffix = opts.new_id_suffix ?? this.randomImportSuffix();
    const { targetIds, conflicts: rawConflicts } = resolveImportIds(
      incomingIds,
      existingIds,
      opts.dry_run ? 'cancel' : onConflict,
      newIdSuffix,
    );
    const conflicts = rawConflicts.map((c) => ({
      id: c.id,
      existing_title: titleById.get(c.id) ?? '',
    }));

    if (opts.dry_run) {
      return {
        success: true,
        data: {
          valid: true,
          conflicts,
          preview: {
            count: items.length,
            items: items.map((item) => ({
              id: item.id,
              title: item.title,
              node_count: Object.keys(item.nodes).length,
            })),
          },
          validation_errors: [] as Array<{ code: string; path?: string }>,
        },
        message: 'ok',
      };
    }

    if (onConflict === 'cancel' && conflicts.length > 0) {
      throw new ConflictException({
        success: false,
        data: null,
        message: 'import_conflict',
      });
    }

    const imported: Array<{ id: string; title: string }> = [];
    const autoRepublishIds = new Set<string>();

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const targetId = targetIds[index];
      const isOverwrite =
        existingIds.has(item.id) && onConflict === 'overwrite' && targetId === item.id;
      const nodesJson = avgImportItemToNodesJson(item);

      if (isOverwrite) {
        if (wasPublishedById.get(item.id)) {
          autoRepublishIds.add(targetId);
        }
        await this.prisma.avgScript.update({
          where: { id: targetId },
          data: {
            title: item.title,
            nodesJson: nodesJson as Prisma.InputJsonValue,
            isPublished: false,
            publishedAt: null,
          },
        });
      } else {
        await this.prisma.avgScript.create({
          data: {
            id: targetId,
            title: item.title,
            nodesJson: nodesJson as Prisma.InputJsonValue,
            isPublished: false,
          },
        });
      }

      imported.push({ id: targetId, title: item.title });
    }

    const publishIds = new Set<string>();
    if (opts.publish_after) {
      for (const row of imported) {
        publishIds.add(row.id);
      }
    } else {
      for (const id of autoRepublishIds) {
        publishIds.add(id);
      }
    }
    for (const id of publishIds) {
      await this.publishAvgScript(id);
    }

    return {
      success: true,
      data: { imported },
      message: 'ok',
    };
  }

  /** AVG 脚本列表（含未发布） */
  async listAvgScripts() {
    return this.prisma.avgScript.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        title: true,
        isPublished: true,
        publishedAt: true,
        nodesJson: true,
      },
    });
  }

  /** AVG 脚本详情 */
  async getAvgScript(id: string) {
    const row = await this.prisma.avgScript.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'avg_script_not_found',
      });
    }
    return row;
  }

  /** 创建 AVG 脚本（默认草稿） */
  async createAvgScript(dto: CreateAvgScriptDto) {
    try {
      return await this.prisma.avgScript.create({
        data: {
          id: dto.id,
          title: dto.title,
          nodesJson: {
            start_node_id: '',
            backgrounds: {},
            nodes: {},
          },
          isPublished: false,
        },
      });
    } catch (e: unknown) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException({
          success: false,
          data: null,
          message: 'avg_script_id_taken',
        });
      }
      throw e;
    }
  }

  /** 更新脚本标题 */
  async updateAvgScriptMeta(id: string, dto: UpdateAvgScriptDto) {
    await this.ensureAvgScriptExists(id);
    return this.prisma.avgScript.update({
      where: { id },
      data: { title: dto.title },
    });
  }

  /** 更新 nodesJson（校验后写入） */
  async updateAvgNodes(id: string, dto: UpdateAvgNodesDto) {
    await this.ensureAvgScriptExists(id);
    try {
      validateAvgNodesJson(dto.nodesJson);
    } catch (err) {
      if (err instanceof AvgScriptValidationError) {
        this.avgValidationToBadRequest(err);
      }
      throw err;
    }

    return this.prisma.avgScript.update({
      where: { id },
      data: { nodesJson: dto.nodesJson as Prisma.InputJsonValue },
    });
  }

  /** 发布 AVG 脚本：再次校验 nodesJson */
  async publishAvgScript(id: string) {
    const row = await this.getAvgScript(id);
    try {
      validateAvgNodesJson(row.nodesJson as Parameters<typeof validateAvgNodesJson>[0]);
    } catch (err) {
      if (err instanceof AvgScriptValidationError) {
        this.avgValidationToBadRequest(err);
      }
      throw err;
    }

    const now = new Date();
    const [, published] = await this.prisma.$transaction([
      this.prisma.avgScript.updateMany({
        where: { id: { not: id }, isPublished: true },
        data: { isPublished: false },
      }),
      this.prisma.avgScript.update({
        where: { id },
        data: { isPublished: true, publishedAt: now },
      }),
    ]);
    return published;
  }

  /** 下架 AVG 脚本 */
  async unpublishAvgScript(id: string) {
    await this.ensureAvgScriptExists(id);
    return this.prisma.avgScript.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  /** 获取精灵文案配置（含草稿） */
  async getSpritePrompts() {
    const row = await this.prisma.spritePromptConfig.findUnique({ where: { id: 'default' } });
    if (!row) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'sprite_prompts_not_found',
      });
    }
    return {
      id: row.id,
      hesitationLines: row.hesitationLines as string[],
      mutexLines: row.mutexLines as Record<string, string[]>,
      isPublished: row.isPublished,
      publishedAt: row.publishedAt,
    };
  }

  /** 更新精灵文案（校验后写入，不自动发布） */
  async updateSpritePrompts(dto: UpdateSpritePromptDto) {
    let normalized;
    try {
      normalized = validateSpritePromptPayload(dto);
    } catch (err) {
      if (err instanceof SpritePromptValidationError) {
        this.spriteValidationToBadRequest(err);
      }
      throw err;
    }

    return this.prisma.spritePromptConfig.upsert({
      where: { id: 'default' },
      update: {
        hesitationLines: normalized.hesitationLines,
        mutexLines: normalized.mutexLines,
      },
      create: {
        id: 'default',
        hesitationLines: normalized.hesitationLines,
        mutexLines: normalized.mutexLines,
        isPublished: false,
      },
    });
  }

  /** 发布精灵文案 */
  async publishSpritePrompts() {
    const row = await this.getSpritePrompts();
    try {
      validateSpritePromptPayload({
        hesitationLines: row.hesitationLines,
        mutexLines: row.mutexLines,
      });
    } catch (err) {
      if (err instanceof SpritePromptValidationError) {
        this.spriteValidationToBadRequest(err);
      }
      throw err;
    }

    return this.prisma.spritePromptConfig.update({
      where: { id: 'default' },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  /** 下架精灵文案 */
  async unpublishSpritePrompts() {
    await this.getSpritePrompts();
    return this.prisma.spritePromptConfig.update({
      where: { id: 'default' },
      data: { isPublished: false },
    });
  }

  private async ensureAvgScriptExists(id: string): Promise<void> {
    const row = await this.prisma.avgScript.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'avg_script_not_found',
      });
    }
  }

  private isUniqueViolation(e: unknown): boolean {
    return (
      typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002'
    );
  }

  private parseImportJson(text: string): AvgImportItem[] {
    try {
      return parseAvgImportJson(text);
    } catch (err) {
      if (this.isImportParseError(err)) {
        throw new BadRequestException({
          success: false,
          data: null,
          message: (err as Error).message,
        });
      }
      throw err;
    }
  }

  private isImportParseError(err: unknown): boolean {
    if (!(err instanceof Error)) {
      return false;
    }
    const { message } = err;
    return message === 'unsupported_schema_version' || message === 'invalid_json';
  }

  private randomImportSuffix(): string {
    return Math.random().toString(36).slice(2, 8);
  }
}
