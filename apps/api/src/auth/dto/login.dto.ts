/**
 * POST `/auth/login` 请求体：昵称与密码。
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ minLength: 2, maxLength: 32 })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  nickname!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
