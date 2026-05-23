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
import { PrismaService } from '../prisma/prisma.service';
import {
  SpritePromptValidationError,
  validateSpritePromptPayload,
} from '../sprite-prompt/sprite-prompt-validation';
import { CreateAvgScriptDto, UpdateAvgScriptDto } from './dto/avg-script.dto';
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

    return this.prisma.avgScript.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });
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
}
