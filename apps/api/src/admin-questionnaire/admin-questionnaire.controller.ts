/**
 * Admin 题库 CMS HTTP 接口（T4.6）：需 ADMIN JWT。
 */
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminQuestionnaireService } from './admin-questionnaire.service';
import { CreateOptionDto, UpdateOptionDto } from './dto/option.dto';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { CreateQuestionnaireDto, UpdateQuestionnaireDto } from './dto/questionnaire.dto';

@ApiTags('admin-questionnaire')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminQuestionnaireController {
  constructor(private readonly service: AdminQuestionnaireService) {}

  @Get('questionnaires')
  @ApiOperation({ summary: '问卷列表（含未发布）' })
  async list() {
    const data = await this.service.listQuestionnaires();
    return { success: true, data, message: 'ok' };
  }

  @Post('questionnaires')
  @ApiOperation({ summary: '创建问卷' })
  async create(@Body() dto: CreateQuestionnaireDto) {
    const data = await this.service.createQuestionnaire(dto);
    return { success: true, data, message: 'ok' };
  }

  @Get('questionnaires/:id')
  @ApiOperation({ summary: '问卷详情（含题目与选项）' })
  async detail(@Param('id') id: string) {
    const data = await this.service.getQuestionnaire(id);
    return { success: true, data, message: 'ok' };
  }

  @Patch('questionnaires/:id')
  @ApiOperation({ summary: '更新问卷元数据' })
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionnaireDto) {
    const data = await this.service.updateQuestionnaire(id, dto);
    return { success: true, data, message: 'ok' };
  }

  @Post('questionnaires/:id/publish')
  @ApiOperation({ summary: '发布问卷' })
  async publish(@Param('id') id: string) {
    const data = await this.service.publishQuestionnaire(id);
    return { success: true, data, message: 'ok' };
  }

  @Post('questionnaires/:id/unpublish')
  @ApiOperation({ summary: '下架问卷' })
  async unpublish(@Param('id') id: string) {
    const data = await this.service.unpublishQuestionnaire(id);
    return { success: true, data, message: 'ok' };
  }

  @Post('questionnaires/:id/questions')
  @ApiOperation({ summary: '新增题目' })
  async createQuestion(@Param('id') id: string, @Body() dto: CreateQuestionDto) {
    const data = await this.service.createQuestion(id, dto);
    return { success: true, data, message: 'ok' };
  }

  @Patch('questionnaires/:id/questions/:qid')
  @ApiOperation({ summary: '更新题目' })
  async updateQuestion(
    @Param('id') id: string,
    @Param('qid') qid: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    const data = await this.service.updateQuestion(id, qid, dto);
    return { success: true, data, message: 'ok' };
  }

  @Delete('questionnaires/:id/questions/:qid')
  @ApiOperation({ summary: '删除题目（硬删）' })
  async deleteQuestion(@Param('id') id: string, @Param('qid') qid: string) {
    const data = await this.service.deleteQuestion(id, qid);
    return { success: true, data, message: 'ok' };
  }

  @Post('questions/:qid/options')
  @ApiOperation({ summary: '新增选项' })
  async createOption(@Param('qid') qid: string, @Body() dto: CreateOptionDto) {
    const data = await this.service.createOption(qid, dto);
    return { success: true, data, message: 'ok' };
  }

  @Patch('options/:oid')
  @ApiOperation({ summary: '更新选项' })
  async updateOption(@Param('oid') oid: string, @Body() dto: UpdateOptionDto) {
    const data = await this.service.updateOption(oid, dto);
    return { success: true, data, message: 'ok' };
  }

  @Delete('options/:oid')
  @ApiOperation({ summary: '删除选项（硬删）' })
  async deleteOption(@Param('oid') oid: string) {
    const data = await this.service.deleteOption(oid);
    return { success: true, data, message: 'ok' };
  }
}
