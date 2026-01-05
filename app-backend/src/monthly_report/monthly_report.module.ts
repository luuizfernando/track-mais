import { Module } from "@nestjs/common";
import { MonthlyReportService } from "./monthly_report.service";
import { MonthlyReportController } from "./monthly_report.controller";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [MonthlyReportController],
  providers: [MonthlyReportService],
})
export class MonthlyReportModule {}
