import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsObject, IsOptional, ValidateNested, IsNumber } from 'class-validator';

// 定义人脸包围盒的数据结构和验证规则
class FaceBoundingBoxDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;
}

export class CreateGenerationDto {
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsString()
  @IsNotEmpty()
  modelKey: string;

  @IsObject()
  @IsOptional()
  options?: Record<string, any>;

  // 新增字段，用于接收前端传来的人脸坐标
  @IsOptional()
  @ValidateNested()
  @Type(() => FaceBoundingBoxDto)
  faceSelection?: FaceBoundingBoxDto;
}
