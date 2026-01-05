import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateDailyReportDto } from "./dto/create-daily_report.dto";
import { UpdateDailyReportDto } from "./dto/update-daily_report.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class DailyReportService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDailyReportDto: CreateDailyReportDto) {
    try {
      // Pre-validações: usuário e veículo (caso informado)
      const [user, vehicle] = await Promise.all([
        this.prisma.users.findFirst({
          where: { id: createDailyReportDto.userId },
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
          HttpStatus.NOT_FOUND,
        );
      }
      if (createDailyReportDto.deliverVehicle && !vehicle) {
        throw new HttpException(
          "Veículo (placa) não encontrado.",
          HttpStatus.NOT_FOUND,
        );
      }

      console.log(
        `Usando invoiceNumber: ${createDailyReportDto.invoiceNumber}, tipo: ${typeof createDailyReportDto.invoiceNumber}`,
      );

      try {
        const rows: any = await this.prisma.$queryRawUnsafe(
          `SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='daily_shipment_report' AND column_name='invoiceNumber'`,
        );
        const t = Array.isArray(rows) && rows[0]?.data_type ? String(rows[0].data_type).toLowerCase() : '';
        if (t !== 'bigint') {
          await this.prisma.$executeRawUnsafe(
            `ALTER TABLE public.daily_shipment_report ALTER COLUMN "invoiceNumber" TYPE BIGINT USING "invoiceNumber"::BIGINT`,
          );
        }
      } catch (_) { }

      // Branch: novo payload com múltiplos clientes
      if (
        createDailyReportDto.customerGroups &&
        createDailyReportDto.customerGroups.length > 0
      ) {
        const results: any[] = [];

        for (const group of createDailyReportDto.customerGroups) {
          // Validar cliente do grupo
          const customer = await this.prisma.customers.findFirst({
            where: { code: Number(group.customerCode) },
          });
          if (!customer) {
            throw new HttpException(
              `Cliente não encontrado: código ${group.customerCode}.`,
              HttpStatus.NOT_FOUND,
            );
          }

          // Sanitizar produtos por cliente para JSON
          const productsJson: Prisma.InputJsonValue = (group.items ?? []).map(
            (p) => ({
              code: p.code,
              quantity: p.quantity,
              ...(p.description ? { description: p.description } : {}),
              ...(p.sifOrSisbi ? { sifOrSisbi: p.sifOrSisbi } : {}),
              productTemperature: p.productTemperature,
              productionDate: p.productionDate,
            }),
          );

          const totalQuantity = (group.items ?? []).reduce(
            (acc, it) => acc + (Number(it.quantity) || 0),
            0,
          );
          const items = group.items ?? [];
          if (items.length === 0) {
            throw new HttpException(
              "Grupo de cliente sem produtos.",
              HttpStatus.BAD_REQUEST,
            );
          }
          // Agregar data de produção (menor data entre itens) e temperatura do produto (mínima)
          const earliestProdTime = items
            .map((it) => new Date(it.productionDate).getTime())
            .reduce(
              (min, t) => (Number.isFinite(min) ? Math.min(min, t) : t),
              Infinity,
            );
          const productionDate = new Date(earliestProdTime);

          const minProductTemp = items
            .map((it) => Number(it.productTemperature))
            .reduce(
              (min, v) => (Number.isFinite(min) ? Math.min(min, v) : v),
              Infinity,
            );

          const primarySifOrSisbi = items[0]?.sifOrSisbi;

          // Criando objeto de dados explicitamente tipado para o Prisma
          const createData = {
            quantity: totalQuantity,
            invoiceNumber: BigInt(createDailyReportDto.invoiceNumber),
            productionDate,
            vehicleTemperature: createDailyReportDto.vehicleTemperature,
            hasGoodSanitaryCondition:
              createDailyReportDto.hasGoodSanitaryCondition,
            driver: createDailyReportDto.driver,
            userId: createDailyReportDto.userId,
            products: productsJson,
            customerCode: BigInt(group.customerCode),
            sifOrSisbi:
              primarySifOrSisbi && primarySifOrSisbi !== "NA"
                ? primarySifOrSisbi
                : null,
            productTemperature: minProductTemp,
            fillingDate: new Date(createDailyReportDto.fillingDate),
            deliverVehicle: createDailyReportDto.deliverVehicle ?? null,
          };

          // Converter BigInt para string antes de serializar
          const logData = {
            ...createData,
            invoiceNumber: String(createData.invoiceNumber),
            customerCode: String(createData.customerCode),
          };
          console.log(`Dados para criar relatório: ${JSON.stringify(logData)}`);

          let created: any;
          try {
            created = await this.prisma.dailyShipmentReport.create({
              data: createData as any,
            });
          } catch (e: any) {
            const msg = String(e?.message || e);
            if (msg.includes('Unable to fit integer value') || msg.includes('INT4')) {
              await this.prisma.$executeRawUnsafe(
                `ALTER TABLE public.daily_shipment_report ALTER COLUMN "invoiceNumber" TYPE BIGINT USING "invoiceNumber"::BIGINT`,
              );
              created = await this.prisma.dailyShipmentReport.create({ data: createData as any });
            } else {
              throw e;
            }
          }

          results.push(created);
        }

        return results;
      }

      // Compatibilidade: payload antigo (cliente único)
      // Validar cliente único
      const customer = await this.prisma.customers.findFirst({
        where: { code: Number(createDailyReportDto.customerCode) },
      });
      if (!customer) {
        throw new HttpException(
          "Cliente não encontrado.",
          HttpStatus.NOT_FOUND,
        );
      }

      const productsJson: Prisma.InputJsonValue = (
        createDailyReportDto.products ?? []
      ).map((p) => ({
        code: p.code,
        quantity: p.quantity,
        ...(p.description ? { description: p.description } : {}),
      }));

      // Criando objeto de dados para o Prisma
      const createData = {
        quantity: createDailyReportDto.quantity!,
        invoiceNumber: BigInt(createDailyReportDto.invoiceNumber),
        productionDate: new Date(createDailyReportDto.productionDate!),
        vehicleTemperature: createDailyReportDto.vehicleTemperature,
        hasGoodSanitaryCondition: createDailyReportDto.hasGoodSanitaryCondition,
        driver: createDailyReportDto.driver,
        userId: createDailyReportDto.userId,
        products: productsJson,
        customerCode: BigInt(createDailyReportDto.customerCode!),
        sifOrSisbi:
          createDailyReportDto.sifOrSisbi &&
            createDailyReportDto.sifOrSisbi !== "NA"
            ? createDailyReportDto.sifOrSisbi
            : null,
        productTemperature: createDailyReportDto.productTemperature!,
        fillingDate: new Date(createDailyReportDto.fillingDate),
        deliverVehicle: createDailyReportDto.deliverVehicle ?? null,
      };

      // Converter BigInt para string antes de serializar
      const logData = {
        ...createData,
        invoiceNumber: String(createData.invoiceNumber),
        customerCode: String(createData.customerCode),
      };
      console.log(
        `Dados para criar relatório (single): ${JSON.stringify(logData)}`,
      );

      let created: any;
      try {
        created = await this.prisma.dailyShipmentReport.create({
          data: createData as any,
        });
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (msg.includes('Unable to fit integer value') || msg.includes('INT4')) {
          await this.prisma.$executeRawUnsafe(
            `ALTER TABLE public.daily_shipment_report ALTER COLUMN "invoiceNumber" TYPE BIGINT USING "invoiceNumber"::BIGINT`,
          );
          created = await this.prisma.dailyShipmentReport.create({ data: createData as any });
        } else {
          throw e;
        }
      }

      return created;
    } catch (err: unknown) {
      // Mensagens amigáveis para erros comuns
      if (err instanceof HttpException) throw err;

      // Tratamento de violações e detalhamento de erro do Prisma
      if (err && typeof err === "object") {
        const anyErr = err as any;
        // Prisma known error
        if (anyErr.code && typeof anyErr.code === "string") {
          const details =
            anyErr.meta?.cause || anyErr.message || "Erro de banco de dados.";
          throw new HttpException(details, HttpStatus.BAD_REQUEST);
        }
      }
      // Logar erro desconhecido para investigação

      console.error("[DailyReportService.create] Unknown error:", err);
      throw new HttpException(
        "Falha ao criar relatório diário.",
        HttpStatus.BAD_REQUEST,
      );
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

  async update(id: number, updateDailyReportDto: UpdateDailyReportDto) {
    try {
      const existing = await this.prisma.dailyShipmentReport.findFirst({
        where: { id },
      });
      if (!existing) {
        throw new HttpException(
          "Relatório não encontrado.",
          HttpStatus.NOT_FOUND,
        );
      }

      // Validar usuário (se enviado)
      if (typeof updateDailyReportDto.userId === "number") {
        const user = await this.prisma.users.findFirst({
          where: { id: updateDailyReportDto.userId },
        });
        if (!user)
          throw new HttpException(
            "Usuário não encontrado.",
            HttpStatus.NOT_FOUND,
          );
      }

      // Validar veículo (se placa enviada)
      if (updateDailyReportDto.deliverVehicle) {
        const vehicle = await this.prisma.vehicle.findFirst({
          where: { plate: updateDailyReportDto.deliverVehicle },
        });
        if (!vehicle)
          throw new HttpException(
            "Veículo (placa) não encontrado.",
            HttpStatus.NOT_FOUND,
          );
      }

      // Usar UncheckedUpdateInput para permitir atualizar FKs diretamente (userId, deliverVehicle, customerCode)
      const data: Prisma.DailyShipmentReportUncheckedUpdateInput = {};

      // Campos simples (mantém valor atual se não enviados)
      if (updateDailyReportDto.invoiceNumber) {
        (data as any).invoiceNumber = BigInt(
          updateDailyReportDto.invoiceNumber as any,
        );
      }
      if (typeof updateDailyReportDto.vehicleTemperature === "number")
        data.vehicleTemperature = updateDailyReportDto.vehicleTemperature;
      if (typeof updateDailyReportDto.hasGoodSanitaryCondition === "boolean")
        data.hasGoodSanitaryCondition =
          updateDailyReportDto.hasGoodSanitaryCondition;
      if (typeof updateDailyReportDto.driver === "string")
        data.driver = updateDailyReportDto.driver;
      if (typeof updateDailyReportDto.userId === "number")
        data.userId = updateDailyReportDto.userId;
      if (typeof updateDailyReportDto.deliverVehicle === "string")
        data.deliverVehicle = updateDailyReportDto.deliverVehicle;

      if (updateDailyReportDto.fillingDate) {
        data.fillingDate = new Date(updateDailyReportDto.fillingDate);
      }

      // Branch 1: atualização via customerGroups (modelo novo)
      if (
        updateDailyReportDto.customerGroups &&
        updateDailyReportDto.customerGroups.length > 0
      ) {
        const group = updateDailyReportDto.customerGroups[0]; // para este relatório único, usamos o primeiro grupo

        const customer = await this.prisma.customers.findFirst({
          where: { code: Number(group.customerCode) },
        });
        if (!customer)
          throw new HttpException(
            `Cliente não encontrado: código ${group.customerCode}.`,
            HttpStatus.NOT_FOUND,
          );

        const items = group.items ?? [];
        if (items.length === 0)
          throw new HttpException(
            "Grupo de cliente sem produtos.",
            HttpStatus.BAD_REQUEST,
          );

        const productsJson: Prisma.InputJsonValue = items.map((p) => ({
          code: p.code,
          quantity: p.quantity,
          ...(p.description ? { description: p.description } : {}),
          ...(p.sifOrSisbi ? { sifOrSisbi: p.sifOrSisbi } : {}),
          productTemperature: p.productTemperature,
          productionDate: p.productionDate,
        }));

        const totalQuantity = items.reduce(
          (acc, it) => acc + (Number(it.quantity) || 0),
          0,
        );
        const earliestProdTime = items
          .map((it) => new Date(it.productionDate).getTime())
          .reduce(
            (min, t) => (Number.isFinite(min) ? Math.min(min, t) : t),
            Infinity,
          );
        const productionDate = new Date(earliestProdTime);
        const minProductTemp = items
          .map((it) => Number(it.productTemperature))
          .reduce(
            (min, v) => (Number.isFinite(min) ? Math.min(min, v) : v),
            Infinity,
          );
        const primarySifOrSisbi = items[0]?.sifOrSisbi;

        data.products = productsJson;
        data.quantity = totalQuantity;
        data.productionDate = productionDate;
        data.productTemperature = minProductTemp;
        data.customerCode = BigInt(group.customerCode);
        data.sifOrSisbi =
          primarySifOrSisbi && primarySifOrSisbi !== "NA"
            ? primarySifOrSisbi
            : null;
      }

      // Branch 2: compatibilidade com payload antigo (products + customerCode etc.)
      if (
        updateDailyReportDto.products &&
        updateDailyReportDto.products.length > 0
      ) {
        const productsJson: Prisma.InputJsonValue =
          updateDailyReportDto.products.map((p) => ({
            code: p.code,
            quantity: p.quantity,
            ...(p.description ? { description: p.description } : {}),
          }));
        data.products = productsJson;
      }
      if (typeof updateDailyReportDto.quantity === "number")
        data.quantity = updateDailyReportDto.quantity;
      if (updateDailyReportDto.productionDate)
        data.productionDate = new Date(updateDailyReportDto.productionDate);
      if (typeof updateDailyReportDto.productTemperature === "number")
        data.productTemperature = updateDailyReportDto.productTemperature;
      if (typeof updateDailyReportDto.customerCode === "number")
        data.customerCode = BigInt(updateDailyReportDto.customerCode);
      if (typeof updateDailyReportDto.sifOrSisbi === "string") {
        data.sifOrSisbi =
          updateDailyReportDto.sifOrSisbi &&
            updateDailyReportDto.sifOrSisbi !== "NA"
            ? updateDailyReportDto.sifOrSisbi
            : null;
      }

      const updated = await this.prisma.dailyShipmentReport.update({
        where: { id },
        data,
      });
      return updated;
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      if (err && typeof err === "object") {
        const anyErr = err as any;
        if (anyErr.code && typeof anyErr.code === "string") {
          const details =
            anyErr.meta?.cause || anyErr.message || "Erro de banco de dados.";
          throw new HttpException(details, HttpStatus.BAD_REQUEST);
        }
      }
      console.error("[DailyReportService.update] Unknown error:", err);
      throw new HttpException(
        "Falha ao atualizar relatório diário.",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  remove(id: number) {
    return this.prisma.dailyShipmentReport.delete({ where: { id } });
  }
}
