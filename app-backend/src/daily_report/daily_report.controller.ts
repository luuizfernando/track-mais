import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DailyReportService } from './daily_report.service';
import { CreateDailyReportDto } from './dto/create-daily_report.dto';
import { UpdateDailyReportDto } from './dto/update-daily_report.dto';
import { AuthTokenGuard } from 'src/auth/guard/auth-token.guard';

@UseGuards(AuthTokenGuard)
@Controller('daily-report')
export class DailyReportController {
  constructor(private readonly dailyReportService: DailyReportService) {}

  @Post()
  create(@Body() createDailyReportDto: CreateDailyReportDto) {
    return this.dailyReportService.create(createDailyReportDto);
  }

  @Get()
  findAll() {
    return this.dailyReportService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dailyReportService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDailyReportDto: UpdateDailyReportDto) {
    return this.dailyReportService.update(+id, updateDailyReportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dailyReportService.remove(+id);
  }
}
