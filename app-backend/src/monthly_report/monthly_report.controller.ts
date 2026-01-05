import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { MonthlyReportService } from "./monthly_report.service";
import { CreateMonthlyReportDto } from "./dto/create-monthly_report.dto";
import { UpdateMonthlyReportDto } from "./dto/update-monthly_report.dto";

@Controller("monthly-report")
export class MonthlyReportController {
  constructor(private readonly monthlyReportService: MonthlyReportService) {}

  @Post()
  create(@Body() createMonthlyReportDto: CreateMonthlyReportDto) {
    return this.monthlyReportService.create(createMonthlyReportDto);
  }

  @Get()
  findAll() {
    return this.monthlyReportService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.monthlyReportService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateMonthlyReportDto: UpdateMonthlyReportDto,
  ) {
    return this.monthlyReportService.update(+id, updateMonthlyReportDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.monthlyReportService.remove(+id);
  }
}
