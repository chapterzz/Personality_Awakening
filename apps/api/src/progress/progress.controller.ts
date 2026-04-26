/**
 * 测评进行中进度 HTTP 接口：GET/PUT/DELETE `/progress`（游客 session_id 或 JWT；mode 必填）。
 */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AssessmentMode } from '@prisma/client';
import type { Request } from 'express';
import { JwtUserService } from '../auth/jwt-user.service';
import { PutProgressBodyDto } from './dto/put-progress-body.dto';
import { ProgressService } from './progress.service';

@ApiTags('progress')
@Controller('progress')
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly jwtUser: JwtUserService,
  ) {}

  private requireMode(modeRaw: string | undefined): AssessmentMode {
    if (modeRaw === 'STANDARD' || modeRaw === 'AVG') {
      return modeRaw;
    }
    throw new BadRequestException({
      success: false,
      data: null,
      message: 'mode_required',
    });
  }

  @Get()
  @ApiOperation({ summary: '获取进行中测评进度（PRD §2.5）' })
  @ApiQuery({
    name: 'mode',
    required: true,
    description: '必填：STANDARD 或 AVG（两套进行中进度按 mode 隔离）',
  })
  @ApiQuery({
    name: 'session_id',
    required: false,
    description: '游客必填；注册用户请在页面右上角 Authorize 填入 Bearer JWT，且勿传本参数',
  })
  async get(
    @Query('session_id') sessionId: string | undefined,
    @Query('mode') modeRaw: string | undefined,
    @Req() req: Request,
  ) {
    const mode = this.requireMode(modeRaw);
    const authorization = req.headers.authorization;
    if (authorization?.toLowerCase().startsWith('bearer ')) {
      const userId = this.jwtUser.tryUserIdFromAuthHeader(authorization);
      if (!userId) {
        throw new UnauthorizedException({
          success: false,
          data: null,
          message: 'invalid_token',
        });
      }
      return this.progressService.getForUser(userId, mode);
    }
    if (!sessionId || sessionId.trim() === '') {
      throw new BadRequestException({
        success: false,
        data: null,
        message: 'session_id_required_without_bearer',
      });
    }
    return this.progressService.getForGuest(sessionId.trim(), mode);
  }

  @Put()
  @ApiOperation({ summary: '保存进度（乐观锁 if_match_revision，PRD §2.5）' })
  @ApiQuery({
    name: 'mode',
    required: true,
    description: '必填：STANDARD 或 AVG，且必须与 body.progress_data.mode 一致',
  })
  @ApiQuery({
    name: 'session_id',
    required: false,
    description: '游客必填；注册用户请用 Authorize 中的 Bearer，且勿传本参数',
  })
  async put(
    @Query('session_id') sessionId: string | undefined,
    @Query('mode') modeRaw: string | undefined,
    @Req() req: Request,
    @Body() body: PutProgressBodyDto,
  ) {
    const mode = this.requireMode(modeRaw);
    if (body.progress_data?.mode !== mode) {
      throw new BadRequestException({
        success: false,
        data: null,
        message: 'mode_query_mismatch_progress_data',
      });
    }
    const authorization = req.headers.authorization;
    if (authorization?.toLowerCase().startsWith('bearer ')) {
      const userId = this.jwtUser.tryUserIdFromAuthHeader(authorization);
      if (!userId) {
        throw new UnauthorizedException({
          success: false,
          data: null,
          message: 'invalid_token',
        });
      }
      return this.progressService.putForUser(userId, mode, body);
    }
    if (!sessionId || sessionId.trim() === '') {
      throw new BadRequestException({
        success: false,
        data: null,
        message: 'session_id_required_without_bearer',
      });
    }
    return this.progressService.putForGuest(sessionId.trim(), mode, body);
  }

  @Delete()
  @ApiOperation({ summary: '删除进行中测评进度（清空 TemporarySession）' })
  @ApiQuery({
    name: 'mode',
    required: true,
    description: '必填：STANDARD 或 AVG',
  })
  @ApiQuery({
    name: 'session_id',
    required: false,
    description: '游客必填；注册用户请用 Authorize 中的 Bearer，且勿传本参数',
  })
  async remove(
    @Query('session_id') sessionId: string | undefined,
    @Query('mode') modeRaw: string | undefined,
    @Req() req: Request,
  ) {
    const mode = this.requireMode(modeRaw);
    const authorization = req.headers.authorization;
    if (authorization?.toLowerCase().startsWith('bearer ')) {
      const userId = this.jwtUser.tryUserIdFromAuthHeader(authorization);
      if (!userId) {
        throw new UnauthorizedException({
          success: false,
          data: null,
          message: 'invalid_token',
        });
      }
      return this.progressService.deleteForUser(userId, mode);
    }
    if (!sessionId || sessionId.trim() === '') {
      throw new BadRequestException({
        success: false,
        data: null,
        message: 'session_id_required_without_bearer',
      });
    }
    return this.progressService.deleteForGuest(sessionId.trim(), mode);
  }
}
