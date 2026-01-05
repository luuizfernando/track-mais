import { PartialType } from "@nestjs/mapped-types";
import { CreateDailyReportDto } from "./create-daily_report.dto";

export class UpdateDailyReportDto extends PartialType(CreateDailyReportDto) {}
