/**
 * Admin 题库 CMS 服务：问卷/题目/选项 CRUD 与发布/下架（T4.6）。
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  QuestionnaireValidationError,
  validateOptionScoring,
  validateQuestionGroupFields,
  validateQuestionnaireForPublish,
} from '../questionnaire/questionnaire-validation';
import { PrismaService } from '../prisma/prisma.service';
import { OnConflict, resolveImportIds } from '../common/cms-export/import-conflict';
import { CreateOptionDto, UpdateOptionDto } from './dto/option.dto';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { CreateQuestionnaireDto, UpdateQuestionnaireDto } from './dto/questionnaire.dto';
import {
  ImportQuestionnaireQueryDto,
  QuestionnaireExportFormat,
} from './dto/import-questionnaire.dto';
import {
  parseQuestionnaireImportCsv,
  parseQuestionnaireImportJson,
  questionnaireDetailToImportItem,
  QuestionnaireImportItem,
  serializeQuestionnaireExportCsv,
  serializeQuestionnaireExportJson,
  validateQuestionnaireImportItems,
} from './questionnaire-import-export';

@Injectable()
export class AdminQuestionnaireService {
  constructor(private readonly prisma: PrismaService) {}

  private validationToBadRequest(err: QuestionnaireValidationError): never {
    throw new BadRequestException({
      success: false,
      data: null,
      message: err.code,
    });
  }

  /** 导出单条问卷为 JSON 或 CSV 文件内容 */
  async exportQuestionnaire(
    id: string,
    format: QuestionnaireExportFormat,
  ): Promise<{ body: string; filename: string; contentType: string }> {
    const detail = await this.getQuestionnaire(id);
    const item = questionnaireDetailToImportItem(detail);
    return this.serializeExport([item], format, `questionnaire-${id}`);
  }

  /** 导出全部问卷为单文件 JSON 或 CSV */
  async exportAllQuestionnaires(
    format: QuestionnaireExportFormat,
  ): Promise<{ body: string; filename: string; contentType: string }> {
    const rows = await this.prisma.standardQuestionnaire.findMany({
      orderBy: { id: 'asc' },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { options: true },
        },
      },
    });
    const items = rows.map((row) => questionnaireDetailToImportItem(row));
    const date = new Date().toISOString().slice(0, 10);
    return this.serializeExport(items, format, `questionnaires-all-${date}`);
  }

  /** 导入问卷：解析、校验、冲突处理与可选发布 */
  async importQuestionnaires(fileBuffer: Buffer, opts: ImportQuestionnaireQueryDto) {
    const text = fileBuffer.toString('utf-8');
    const items = this.parseImportFile(text, opts.format);

    const validationErrors = validateQuestionnaireImportItems(items);
    if (validationErrors.length > 0) {
      throw new BadRequestException({
        success: false,
        data: { validation_errors: validationErrors },
        message: 'validation_failed',
      });
    }

    const incomingIds = items.map((item) => item.id);
    const existingRows = await this.prisma.standardQuestionnaire.findMany({
      where: { id: { in: incomingIds } },
      select: { id: true, title: true },
    });
    const existingIds = new Set(existingRows.map((row) => row.id));
    const titleById = new Map(existingRows.map((row) => [row.id, row.title]));

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
              question_count: item.questions.length,
            })),
          },
          validation_errors: [] as Array<{ code: string; path?: string; row?: number }>,
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

    await this.assertNoGlobalQuestionOptionDuplicates(items, targetIds, existingIds, onConflict);

    const imported: Array<{ id: string; title: string }> = [];

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const targetId = targetIds[index];
      const isOverwrite =
        existingIds.has(item.id) && onConflict === 'overwrite' && targetId === item.id;

      await this.prisma.$transaction(async (tx) => {
        if (isOverwrite) {
          await tx.standardQuestionnaire.update({
            where: { id: targetId },
            data: { title: item.title, isPublished: false, publishedAt: null },
          });
          await tx.standardQuestion.deleteMany({ where: { questionnaireId: targetId } });
        } else {
          await tx.standardQuestionnaire.create({
            data: {
              id: targetId,
              title: item.title,
              isPublished: false,
            },
          });
        }

        for (const q of item.questions) {
          await tx.standardQuestion.create({
            data: {
              id: q.id,
              questionnaireId: targetId,
              prompt: q.prompt,
              sortOrder: q.sort_order,
              dimension: q.dimension,
              groupTag: q.group_tag,
              groupSortOrder: q.group_sort_order,
              options: {
                create: q.options.map((o) => ({
                  id: o.id,
                  label: o.label,
                  valueKey: o.value_key,
                  dimension: o.dimension,
                  side: o.side,
                  weight: o.weight,
                })),
              },
            },
          });
        }
      });

      imported.push({ id: targetId, title: item.title });
    }

    if (opts.publish_after) {
      for (const row of imported) {
        await this.publishQuestionnaire(row.id);
      }
    }

    return {
      success: true,
      data: { imported },
      message: 'ok',
    };
  }

  /** 列出全部问卷（含未发布） */
  async listQuestionnaires() {
    return this.prisma.standardQuestionnaire.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        title: true,
        isPublished: true,
        publishedAt: true,
        _count: { select: { questions: true } },
      },
    });
  }

  /** 问卷详情：含题目与选项 */
  async getQuestionnaire(id: string) {
    const questionnaire = await this.prisma.standardQuestionnaire.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { options: true },
        },
      },
    });
    if (!questionnaire) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'questionnaire_not_found',
      });
    }
    return questionnaire;
  }

  /** 创建问卷（默认草稿） */
  async createQuestionnaire(dto: CreateQuestionnaireDto) {
    try {
      return await this.prisma.standardQuestionnaire.create({
        data: {
          id: dto.id,
          title: dto.title,
          isPublished: false,
        },
      });
    } catch (e: unknown) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException({
          success: false,
          data: null,
          message: 'questionnaire_id_taken',
        });
      }
      throw e;
    }
  }

  /** 更新问卷元数据 */
  async updateQuestionnaire(id: string, dto: UpdateQuestionnaireDto) {
    await this.ensureQuestionnaireExists(id);
    return this.prisma.standardQuestionnaire.update({
      where: { id },
      data: { title: dto.title },
    });
  }

  /** 发布问卷：校验 screening 题与选项完整性 */
  async publishQuestionnaire(id: string) {
    const questionnaire = await this.getQuestionnaire(id);
    try {
      validateQuestionnaireForPublish(
        questionnaire.questions.map((q) => ({
          groupTag: q.groupTag,
          options: q.options.map((o) => ({
            dimension: o.dimension,
            side: o.side,
            weight: o.weight,
          })),
        })),
      );
    } catch (err) {
      if (err instanceof QuestionnaireValidationError) {
        this.validationToBadRequest(err);
      }
      throw err;
    }

    return this.prisma.standardQuestionnaire.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  /** 下架问卷 */
  async unpublishQuestionnaire(id: string) {
    await this.ensureQuestionnaireExists(id);
    return this.prisma.standardQuestionnaire.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  /** 新增题目 */
  async createQuestion(questionnaireId: string, dto: CreateQuestionDto) {
    await this.ensureQuestionnaireExists(questionnaireId);
    try {
      validateQuestionGroupFields({
        dimension: dto.dimension ?? null,
        groupTag: dto.groupTag ?? null,
      });
    } catch (err) {
      if (err instanceof QuestionnaireValidationError) {
        this.validationToBadRequest(err);
      }
      throw err;
    }

    try {
      return await this.prisma.standardQuestion.create({
        data: {
          id: dto.id,
          questionnaireId,
          prompt: dto.prompt,
          sortOrder: dto.sortOrder,
          dimension: dto.dimension ?? null,
          groupTag: dto.groupTag ?? null,
          groupSortOrder: dto.groupSortOrder ?? null,
        },
      });
    } catch (e: unknown) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException({
          success: false,
          data: null,
          message: 'question_id_taken',
        });
      }
      throw e;
    }
  }

  /** 更新题目 */
  async updateQuestion(questionnaireId: string, questionId: string, dto: UpdateQuestionDto) {
    await this.ensureQuestionBelongsToQuestionnaire(questionnaireId, questionId);

    const existing = await this.prisma.standardQuestion.findUniqueOrThrow({
      where: { id: questionId },
    });
    const dimension = dto.dimension !== undefined ? dto.dimension : existing.dimension;
    const groupTag = dto.groupTag !== undefined ? dto.groupTag : existing.groupTag;

    try {
      validateQuestionGroupFields({ dimension, groupTag });
    } catch (err) {
      if (err instanceof QuestionnaireValidationError) {
        this.validationToBadRequest(err);
      }
      throw err;
    }

    return this.prisma.standardQuestion.update({
      where: { id: questionId },
      data: {
        prompt: dto.prompt,
        sortOrder: dto.sortOrder,
        dimension: dto.dimension,
        groupTag: dto.groupTag,
        groupSortOrder: dto.groupSortOrder,
      },
    });
  }

  /** 硬删题目（级联删除选项） */
  async deleteQuestion(questionnaireId: string, questionId: string) {
    await this.ensureQuestionBelongsToQuestionnaire(questionnaireId, questionId);
    await this.prisma.standardQuestion.delete({ where: { id: questionId } });
    return { deleted: true };
  }

  /** 新增选项 */
  async createOption(questionId: string, dto: CreateOptionDto) {
    await this.ensureQuestionExists(questionId);
    try {
      validateOptionScoring({
        dimension: dto.dimension ?? null,
        side: dto.side ?? null,
        weight: dto.weight ?? null,
      });
    } catch (err) {
      if (err instanceof QuestionnaireValidationError) {
        this.validationToBadRequest(err);
      }
      throw err;
    }

    try {
      return await this.prisma.standardQuestionOption.create({
        data: {
          id: dto.id,
          questionId,
          label: dto.label,
          valueKey: dto.valueKey,
          dimension: dto.dimension ?? null,
          side: dto.side ?? null,
          weight: dto.weight ?? null,
        },
      });
    } catch (e: unknown) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException({
          success: false,
          data: null,
          message: 'option_id_taken',
        });
      }
      throw e;
    }
  }

  /** 更新选项 */
  async updateOption(optionId: string, dto: UpdateOptionDto) {
    const existing = await this.prisma.standardQuestionOption.findUnique({
      where: { id: optionId },
    });
    if (!existing) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'option_not_found',
      });
    }

    const dimension = dto.dimension !== undefined ? dto.dimension : existing.dimension;
    const side = dto.side !== undefined ? dto.side : existing.side;
    const weight = dto.weight !== undefined ? dto.weight : existing.weight;

    try {
      validateOptionScoring({ dimension, side, weight });
    } catch (err) {
      if (err instanceof QuestionnaireValidationError) {
        this.validationToBadRequest(err);
      }
      throw err;
    }

    return this.prisma.standardQuestionOption.update({
      where: { id: optionId },
      data: {
        label: dto.label,
        valueKey: dto.valueKey,
        dimension: dto.dimension,
        side: dto.side,
        weight: dto.weight,
      },
    });
  }

  /** 硬删选项 */
  async deleteOption(optionId: string) {
    const existing = await this.prisma.standardQuestionOption.findUnique({
      where: { id: optionId },
    });
    if (!existing) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'option_not_found',
      });
    }
    await this.prisma.standardQuestionOption.delete({ where: { id: optionId } });
    return { deleted: true };
  }

  private async ensureQuestionnaireExists(id: string): Promise<void> {
    const row = await this.prisma.standardQuestionnaire.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'questionnaire_not_found',
      });
    }
  }

  private async ensureQuestionExists(questionId: string): Promise<void> {
    const row = await this.prisma.standardQuestion.findUnique({ where: { id: questionId } });
    if (!row) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'question_not_found',
      });
    }
  }

  private async ensureQuestionBelongsToQuestionnaire(
    questionnaireId: string,
    questionId: string,
  ): Promise<void> {
    const row = await this.prisma.standardQuestion.findFirst({
      where: { id: questionId, questionnaireId },
    });
    if (!row) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'question_not_found',
      });
    }
  }

  private isUniqueViolation(e: unknown): boolean {
    return (
      typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002'
    );
  }

  private serializeExport(
    items: QuestionnaireImportItem[],
    format: QuestionnaireExportFormat,
    filenameBase: string,
  ): { body: string; filename: string; contentType: string } {
    if (format === 'json') {
      return {
        body: serializeQuestionnaireExportJson(items),
        filename: `${filenameBase}.json`,
        contentType: 'application/json; charset=utf-8',
      };
    }
    return {
      body: serializeQuestionnaireExportCsv(items),
      filename: `${filenameBase}.csv`,
      contentType: 'text/csv; charset=utf-8',
    };
  }

  private parseImportFile(
    text: string,
    format: QuestionnaireExportFormat,
  ): QuestionnaireImportItem[] {
    try {
      return format === 'json'
        ? parseQuestionnaireImportJson(text)
        : parseQuestionnaireImportCsv(text);
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
    const codes = [
      'unsupported_schema_version',
      'invalid_json',
      'invalid_csv',
      'inconsistent_questionnaire_title',
    ];
    if (codes.includes(message) || message.startsWith('csv_row_error')) {
      return true;
    }
    return false;
  }

  /** create_new 或非覆盖写入前检查题目/选项 ID 全局唯一 */
  private async assertNoGlobalQuestionOptionDuplicates(
    items: QuestionnaireImportItem[],
    targetIds: string[],
    existingIds: Set<string>,
    onConflict: OnConflict,
  ): Promise<void> {
    const questionIds: string[] = [];
    const optionIds: string[] = [];

    items.forEach((item, index) => {
      const targetId = targetIds[index];
      const isOverwrite =
        existingIds.has(item.id) && onConflict === 'overwrite' && targetId === item.id;
      if (isOverwrite) {
        return;
      }
      for (const q of item.questions) {
        questionIds.push(q.id);
        for (const o of q.options) {
          optionIds.push(o.id);
        }
      }
    });

    if (questionIds.length === 0) {
      return;
    }

    const dupQuestion = await this.prisma.standardQuestion.findFirst({
      where: { id: { in: questionIds } },
      select: { id: true },
    });
    if (dupQuestion) {
      throw new BadRequestException({
        success: false,
        data: { validation_errors: [{ code: 'duplicate_question_id' }] },
        message: 'duplicate_question_id',
      });
    }

    const dupOption = await this.prisma.standardQuestionOption.findFirst({
      where: { id: { in: optionIds } },
      select: { id: true },
    });
    if (dupOption) {
      throw new BadRequestException({
        success: false,
        data: { validation_errors: [{ code: 'duplicate_option_id' }] },
        message: 'duplicate_option_id',
      });
    }
  }

  private randomImportSuffix(): string {
    return Math.random().toString(36).slice(2, 8);
  }
}
