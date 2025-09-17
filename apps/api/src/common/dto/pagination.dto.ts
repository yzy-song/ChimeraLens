import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
export class PaginationDto {
  @IsOptional()
  @Type(() => Number) // 将查询参数（字符串）自动转换为数字
  @IsNumber()
  @Min(1)
  @ApiProperty({ description: 'Current page number', example: 1 })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit?: number = 10;
}
