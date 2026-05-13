import { IsOptional, IsString, IsObject } from 'class-validator';

export class CreateHistoryDto {
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsObject()
  detectedFoods?: Record<string, any>;

  @IsOptional()
  @IsObject()
  nutritionResult?: Record<string, any>;
}
