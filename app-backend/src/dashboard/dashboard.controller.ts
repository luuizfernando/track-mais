import { Controller, Get, UseGuards } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { AuthTokenGuard } from "src/auth/guard/auth-token.guard";

@UseGuards(AuthTokenGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("stats")
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('mostProductsSold')
  getMostProductsSold() {
    return this.dashboardService.mostProductsSold();
  }

  @Get('productsSoldByState')
  getProductsSoldByState() {
    return this.dashboardService.productsSoldByState();
  }
}
