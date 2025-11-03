import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class ProductItemDto {
  @IsInt()
  @Min(1)
  code!: number;

  @IsInt()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateDailyReportDto {
  @IsInt()
  @Min(0)
  quantity!: number;

  @IsInt()
  @Min(1)
  invoiceNumber!: number;

  // Timestamp (ISO string)
  @IsDateString()
  productionDate!: string;

  @Type(() => Number)
  @IsNumber()
  vehicleTemperature!: number;

  @IsBoolean()
  hasGoodSanitaryCondition!: boolean;

  @IsString()
  @IsNotEmpty()
  driver!: string;

  @IsInt()
  userId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductItemDto)
  products!: ProductItemDto[];

  // BigInt handled as numeric string to preserve precision
  @IsString()
  customerCode!: string;

  @IsBoolean()
  hasSifOrSisbi!: boolean;

  @Type(() => Number)
  @IsNumber()
  productTemperature!: number;

  @IsDateString()
  fillingDate!: string;

  @IsDateString()
  shipmentDate!: string;

  @IsOptional()
  @IsString()
  deliverVehicle?: string;
}