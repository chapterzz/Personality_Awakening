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
import { CreateOptionDto, UpdateOptionDto } from './dto/option.dto';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { CreateQuestionnaireDto, UpdateQuestionnaireDto } from './dto/questionnaire.dto';

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
}
