import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
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

// Novo: item de produto por cliente, com atributos específicos
export class ProductForCustomerDto {
  @IsInt()
  @Min(1)
  code!: number;

  @IsInt()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(["SIF", "SISBI", "NA"])
  sifOrSisbi?: string; // "NA" permitido

  @Type(() => Number)
  @IsNumber()
  productTemperature!: number;

  @IsDateString()
  productionDate!: string; // por item
}

export class CustomerGroupDto {
  @IsInt()
  @Min(1)
  customerCode!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductForCustomerDto)
  items!: ProductForCustomerDto[];
}

export class CreateDailyReportDto {
  // Mantido para compatibilidade com payload antigo (single cliente)
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  invoiceNumber!: number;

  // Timestamp (ISO string)
  @IsOptional()
  @IsDateString()
  productionDate?: string;

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

  // Payload antigo (single cliente)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductItemDto)
  products?: ProductItemDto[];

  // Código do cliente (BigInt no banco, aceitamos number aqui)
  @IsOptional()
  @IsInt()
  customerCode?: number;
  // Agora aceita também "NA"; manter opcional
  @IsOptional()
  @IsString()
  @IsIn(["SIF", "SISBI", "NA"]) 
  sifOrSisbi?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  productTemperature?: number;

  @IsDateString()
  fillingDate!: string;

  // Removido: shipmentDate não existe mais no schema

  @IsOptional()
  @IsString()
  deliverVehicle?: string;

  // Novo: suporte a múltiplos clientes com produtos detalhados
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerGroupDto)
  customerGroups?: CustomerGroupDto[];
}
