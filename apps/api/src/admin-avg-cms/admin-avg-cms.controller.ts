/**
 * Admin AVG / 精灵文案 CMS HTTP 接口（T4.7）：需 ADMIN JWT。
 */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminAvgCmsService } from './admin-avg-cms.service';
import { CreateAvgScriptDto, UpdateAvgScriptDto } from './dto/avg-script.dto';
import { ImportAvgScriptQueryDto } from './dto/import-avg-script.dto';
import { UpdateAvgNodesDto } from './dto/update-avg-nodes.dto';
import { UpdateSpritePromptDto } from './dto/update-sprite-prompt.dto';

@ApiTags('admin-avg-cms')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAvgCmsController {
  constructor(private readonly service: AdminAvgCmsService) {}

  @Get('avg-scripts')
  @ApiOperation({ summary: 'AVG 脚本列表（含未发布）' })
  async listAvgScripts() {
    const data = await this.service.listAvgScripts();
    return { success: true, data, message: 'ok' };
  }

  @Post('avg-scripts')
  @ApiOperation({ summary: '创建 AVG 脚本' })
  async createAvgScript(@Body() dto: CreateAvgScriptDto) {
    const data = await this.service.createAvgScript(dto);
    return { success: true, data, message: 'ok' };
  }

  @Get('avg-scripts/export-all')
  @ApiOperation({ summary: '导出全部 AVG 脚本（JSON 单文件）' })
  async exportAllAvgScripts(@Res({ passthrough: false }) res: Response) {
    const { body, filename, contentType } = await this.service.exportAllAvgScripts();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(body);
  }

  @Post('avg-scripts/import')
  @ApiOperation({ summary: '导入 AVG 脚本（JSON）' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importAvgScripts(
    @UploadedFile() file: { buffer: Buffer } | undefined,
    @Query() query: ImportAvgScriptQueryDto,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException({
        success: false,
        data: null,
        message: 'file_required',
      });
    }
    return this.service.importAvgScripts(file.buffer, query);
  }

  @Get('avg-scripts/:id/export')
  @ApiOperation({ summary: '导出单条 AVG 脚本（JSON）' })
  async exportAvgScript(@Param('id') id: string, @Res({ passthrough: false }) res: Response) {
    const { body, filename, contentType } = await this.service.exportAvgScript(id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(body);
  }

  @Get('avg-scripts/:id')
  @ApiOperation({ summary: 'AVG 脚本详情' })
  async getAvgScript(@Param('id') id: string) {
    const data = await this.service.getAvgScript(id);
    return { success: true, data, message: 'ok' };
  }

  @Patch('avg-scripts/:id')
  @ApiOperation({ summary: '更新 AVG 脚本元数据' })
  async updateAvgScriptMeta(@Param('id') id: string, @Body() dto: UpdateAvgScriptDto) {
    const data = await this.service.updateAvgScriptMeta(id, dto);
    return { success: true, data, message: 'ok' };
  }

  @Put('avg-scripts/:id/nodes')
  @ApiOperation({ summary: '更新 AVG nodesJson（校验后写入）' })
  async updateAvgNodes(@Param('id') id: string, @Body() dto: UpdateAvgNodesDto) {
    const data = await this.service.updateAvgNodes(id, dto);
    return { success: true, data, message: 'ok' };
  }

  @Post('avg-scripts/:id/publish')
  @ApiOperation({ summary: '发布 AVG 脚本' })
  async publishAvgScript(@Param('id') id: string) {
    const data = await this.service.publishAvgScript(id);
    return { success: true, data, message: 'ok' };
  }

  @Post('avg-scripts/:id/unpublish')
  @ApiOperation({ summary: '下架 AVG 脚本' })
  async unpublishAvgScript(@Param('id') id: string) {
    const data = await this.service.unpublishAvgScript(id);
    return { success: true, data, message: 'ok' };
  }

  @Get('sprite-prompts')
  @ApiOperation({ summary: '精灵文案配置（含草稿）' })
  async getSpritePrompts() {
    const data = await this.service.getSpritePrompts();
    return { success: true, data, message: 'ok' };
  }

  @Put('sprite-prompts')
  @ApiOperation({ summary: '更新精灵文案' })
  async updateSpritePrompts(@Body() dto: UpdateSpritePromptDto) {
    const data = await this.service.updateSpritePrompts(dto);
    return { success: true, data, message: 'ok' };
  }

  @Post('sprite-prompts/publish')
  @ApiOperation({ summary: '发布精灵文案' })
  async publishSpritePrompts() {
    const data = await this.service.publishSpritePrompts();
    return { success: true, data, message: 'ok' };
  }

  @Post('sprite-prompts/unpublish')
  @ApiOperation({ summary: '下架精灵文案' })
  async unpublishSpritePrompts() {
    const data = await this.service.unpublishSpritePrompts();
    return { success: true, data, message: 'ok' };
  }
}
