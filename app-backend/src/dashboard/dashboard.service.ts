import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [products, customers, vehicles] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.customers.count(),
      this.prisma.vehicle.count(),
    ]);

    return {
      products,
      customers,
      vehicles,
    };
  }
}
