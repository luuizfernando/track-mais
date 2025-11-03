import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class VehicleService {

  constructor(private readonly prisma: PrismaService) { }

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
          orderBy: { id: 'desc' },
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
        'Erro ao buscar veiculos.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
