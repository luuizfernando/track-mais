import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async createVehicle(vehicle: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        maximumLoad: vehicle.maximumLoad,
        model: vehicle.model,
        plate: vehicle.plate,
        phone: vehicle.phone,
        description: vehicle.description,
      },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 13, offset = 0 } = paginationDto;

    try {
      const [vehicles, total] = await this.prisma.$transaction([
        this.prisma.vehicle.findMany({
          skip: offset,
          take: limit,
          orderBy: { id: "desc" },
        }),
        this.prisma.vehicle.count(),
      ]);

      return {
        data: vehicles,
        limit,
        offset,
        total,
      };
    } catch (err) {
      throw new HttpException(
        "Erro ao buscar veiculos.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteVehicle(id: number) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id },
      });

      if (!vehicle) {
        throw new HttpException(
          "Esse veículo não existe.",
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.vehicle.delete({
        where: { id: vehicle.id },
      });

      return { message: "Veículo deletado com sucesso!" };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(
        "Falha ao deletar veículo.",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updateVehicle(id: number, payload: Partial<CreateVehicleDto>) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
      if (!vehicle) {
        throw new HttpException(
          "Esse veículo não existe.",
          HttpStatus.NOT_FOUND,
        );
      }
      const updated = await this.prisma.vehicle.update({
        where: { id },
        data: {
          model: payload.model ?? vehicle.model,
          plate: payload.plate ?? vehicle.plate,
          phone: payload.phone ?? vehicle.phone,
          maximumLoad: payload.maximumLoad ?? vehicle.maximumLoad,
          description: payload.description ?? vehicle.description,
        },
      });
      return { updated, message: "Veículo atualizado com sucesso!" };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        "Falha ao atualizar veículo.",
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
