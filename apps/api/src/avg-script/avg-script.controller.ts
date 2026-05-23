/**
 * AVG 脚本公开 HTTP 接口（T4.7）：GET /avg-script/:id。
 */
import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AvgScriptService } from './avg-script.service';

@ApiTags('avg-script')
@Controller('avg-script')
export class AvgScriptController {
  constructor(private readonly service: AvgScriptService) {}

  @Get(':id')
  @Header('Cache-Control', 'no-cache')
  @ApiOperation({ summary: '获取已发布 AVG 脚本' })
  @ApiParam({ name: 'id', description: '脚本 ID' })
  async getScript(@Param('id') id: string) {
    const data = await this.service.getPublishedScriptOrThrow(id);
    return { success: true, data, message: 'ok' };
  }
}
