import { Injectable } from "@nestjs/common";
import { CreateMonthlyReportDto } from "./dto/create-monthly_report.dto";
import { UpdateMonthlyReportDto } from "./dto/update-monthly_report.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class MonthlyReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMonthlyReportDto: any /* CreateMonthlyReportDto */) {
    // implementação básica de criação caso necessário
    const data: Prisma.MonthlyShipmentReportCreateInput = {
      quantity: new Prisma.Decimal(createMonthlyReportDto?.quantity ?? 0),
      destination: createMonthlyReportDto?.destination ?? "N/A",
      temperature: new Prisma.Decimal(createMonthlyReportDto?.temperature ?? 0),
      deliverer: createMonthlyReportDto?.deliverer ?? "Próprio",
      productionDate: new Date(
        createMonthlyReportDto?.productionDate ?? new Date(),
      ),
      shipmentDate: new Date(
        createMonthlyReportDto?.shipmentDate ?? new Date(),
      ),
      productId: Number(createMonthlyReportDto?.productId ?? 0),
      customersId: Number(createMonthlyReportDto?.customersId ?? 0),
    } as any;
    return this.prisma.monthlyShipmentReport.create({ data });
  }

  findAll() {
    // Retorna todos os registros mensais mais recentes primeiro
    return this.prisma.monthlyShipmentReport.findMany({
      orderBy: { id: "desc" },
    });
  }

  findOne(id: number) {
    return this.prisma.monthlyShipmentReport.findFirst({ where: { id } });
  }

  update(id: number, updateMonthlyReportDto: any /* UpdateMonthlyReportDto */) {
    const data: Prisma.MonthlyShipmentReportUncheckedUpdateInput = {};
    if (typeof updateMonthlyReportDto?.quantity === "number") {
      (data as any).quantity = new Prisma.Decimal(
        updateMonthlyReportDto.quantity,
      );
    }
    if (typeof updateMonthlyReportDto?.temperature === "number") {
      (data as any).temperature = new Prisma.Decimal(
        updateMonthlyReportDto.temperature,
      );
    }
    if (typeof updateMonthlyReportDto?.destination === "string")
      data.destination = updateMonthlyReportDto.destination;
    if (typeof updateMonthlyReportDto?.deliverer === "string")
      data.deliverer = updateMonthlyReportDto.deliverer;
    if (updateMonthlyReportDto?.productionDate)
      data.productionDate = new Date(updateMonthlyReportDto.productionDate);
    if (updateMonthlyReportDto?.shipmentDate)
      data.shipmentDate = new Date(updateMonthlyReportDto.shipmentDate);
    if (typeof updateMonthlyReportDto?.productId === "number")
      data.productId = updateMonthlyReportDto.productId;
    if (typeof updateMonthlyReportDto?.customersId === "number")
      data.customersId = updateMonthlyReportDto.customersId;
    return this.prisma.monthlyShipmentReport.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.monthlyShipmentReport.delete({ where: { id } });
  }
}
