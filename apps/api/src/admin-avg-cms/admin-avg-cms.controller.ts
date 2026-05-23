/**
 * Admin AVG / 精灵文案 CMS HTTP 接口（T4.7）：需 ADMIN JWT。
 */
import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminAvgCmsService } from './admin-avg-cms.service';
import { CreateAvgScriptDto, UpdateAvgScriptDto } from './dto/avg-script.dto';
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
