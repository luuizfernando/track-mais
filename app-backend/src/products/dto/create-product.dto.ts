import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsInt,
  IsDecimal,
  isNotEmpty,
} from "class-validator";

export class CreateProductDto {
  @IsNotEmpty()
  @IsInt()
  code: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  group: string;

  @IsNotEmpty()
  @IsString()
  company: string;
}
