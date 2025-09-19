import { IsNotEmpty, IsString, IsObject, IsOptional, IsUrl } from 'class-validator';

export class CreateGenerationDto {
  // 不再需要 templateImageUrl
  // @IsUrl()
  // @IsNotEmpty()
  // templateImageUrl: string;

  @IsString()
  @IsNotEmpty()
  templateId: string; // <-- 改为接收 templateId这样后端就能获取到模板的所有信息（包括 isPremium 状态）。

  @IsString()
  @IsNotEmpty()
  modelKey: string;

  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}
