import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateDailyReportDto } from "./dto/create-daily_report.dto";
import { UpdateDailyReportDto } from "./dto/update-daily_report.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class DailyReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDailyReportDto: CreateDailyReportDto) {
    
    try {
      // Pre-validações de integridade referencial
      const [user, customer, vehicle] = await Promise.all([
        this.prisma.users.findFirst({
          where: { id: createDailyReportDto.userId },
        }),
        this.prisma.customers.findFirst({
          where: { code: Number(createDailyReportDto.customerCode) },
        }),
        createDailyReportDto.deliverVehicle
          ? this.prisma.vehicle.findFirst({
              where: { plate: createDailyReportDto.deliverVehicle },
            })
          : Promise.resolve(null),
      ]);

      if (!user) {
        throw new HttpException(
          "Usuário não encontrado.",
          HttpStatus.NOT_FOUND
        );
      }

      if (!customer) {
        throw new HttpException(
          "Cliente não encontrado.",
          HttpStatus.NOT_FOUND
        );
      }

      if (createDailyReportDto.deliverVehicle && !vehicle) {
        throw new HttpException(
          "Veículo (placa) não encontrado.",
          HttpStatus.NOT_FOUND
        );
      }

      // Sanitizar produtos para JSON (sem valores undefined)
      const productsJson: Prisma.InputJsonValue = (createDailyReportDto.products ?? []).map(
        (p) => ({
          code: p.code,
          quantity: p.quantity,
          ...(p.description ? { description: p.description } : {}),
        })
      );

      const created = await this.prisma.dailyShipmentReport.create({
        // Cast to any to avoid transient Prisma client type mismatch while schema/client are out of sync
        data: {
          quantity: createDailyReportDto.quantity,
          invoiceNumber: createDailyReportDto.invoiceNumber,
          productionDate: new Date(createDailyReportDto.productionDate),
          vehicleTemperature: createDailyReportDto.vehicleTemperature,
          hasGoodSanitaryCondition:
            createDailyReportDto.hasGoodSanitaryCondition,
          driver: createDailyReportDto.driver,
          userId: createDailyReportDto.userId,
          products: productsJson, // JSON
          customerCode: Number(createDailyReportDto.customerCode),
          hasSifOrSisbi: createDailyReportDto.hasSifOrSisbi,
          productTemperature: createDailyReportDto.productTemperature,
          // Preenchimento: data/hora atual do servidor
          fillingDate: new Date(),
          shipmentDate: new Date(createDailyReportDto.shipmentDate),
          deliverVehicle: createDailyReportDto.deliverVehicle ?? null,
        } as any,
      });

      return created;
    } catch (err: unknown) {
      // Mensagens amigáveis para erros comuns
      if (err instanceof HttpException) throw err;

      // Tratamento de violações e detalhamento de erro do Prisma
      if (err && typeof err === "object") {
        const anyErr = err as any;
        // Prisma known error
        if (anyErr.code && typeof anyErr.code === "string") {
          const details = anyErr.meta?.cause || anyErr.message || "Erro de banco de dados.";
          throw new HttpException(details, HttpStatus.BAD_REQUEST);
        }
      }
      // Logar erro desconhecido para investigação
      // eslint-disable-next-line no-console
      console.error("[DailyReportService.create] Unknown error:", err);
      throw new HttpException("Falha ao criar relatório diário.", HttpStatus.BAD_REQUEST);
    }
  }

  findAll() {
    return this.prisma.dailyShipmentReport.findMany({
      orderBy: { id: "desc" },
    });
  }

  findOne(id: number) {
    return this.prisma.dailyShipmentReport.findFirst({ where: { id } });
  }

  update(id: number, updateDailyReportDto: UpdateDailyReportDto) {
    return `This action updates a #${id} dailyReport`;
  }

  remove(id: number) {
    return this.prisma.dailyShipmentReport.delete({ where: { id } });
  }

}