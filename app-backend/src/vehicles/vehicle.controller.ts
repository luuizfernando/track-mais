import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { VehicleService } from "./vehicle.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { AuthTokenGuard } from "src/auth/guard/auth-token.guard";
import { AdminRolesGuard } from "src/auth/guard/roles/admin-roles.guard";
import { PaginationDto } from "src/common/dto/pagination.dto";

@UseGuards(AuthTokenGuard)
@Controller("vehicles")
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @UseGuards(AdminRolesGuard)
  @Post("register-vehicle")
  createVehicle(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehicleService.createVehicle(createVehicleDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.vehicleService.findAll(paginationDto);
  }

}
