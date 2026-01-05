import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { UsersModule } from "src/users/users.module";
import { ProductsModule } from "src/products/products.module";
import { CustomersModule } from "src/customers/customers.module";
import { AuthModule } from "src/auth/auth.module";
import { VehicleModule } from "src/vehicles/vehicle.module";
import { DailyReportModule } from "src/daily_report/daily_report.module";
import { DashboardModule } from "src/dashboard/dashboard.module";
import { MonthlyReportModule } from "src/monthly_report/monthly_report.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    ProductsModule,
    CustomersModule,
    VehicleModule,
    AuthModule,
    DailyReportModule,
    DashboardModule,
    MonthlyReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}