import { PartialType } from "@nestjs/mapped-types";
import { CreateMonthlyReportDto } from "./create-monthly_report.dto";

export class UpdateMonthlyReportDto extends PartialType(
  CreateMonthlyReportDto,
) {}
