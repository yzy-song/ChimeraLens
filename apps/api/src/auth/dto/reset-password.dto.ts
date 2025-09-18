import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class ResetPasswordDto {
  @ApiProperty({ description: '重置密码的令牌', example: 'abc123' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: '新密码', example: '123456' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}
