import { Injectable } from '@nestjs/common';
import { not } from 'rxjs/internal/util/not';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) { }

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

  async mostProductsSold() {
    const grouped = await this.prisma.monthlyShipmentReport.groupBy({
      by: ['productId'],
      _count: { productId: true },
      _sum: { quantity: true },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
    });

    // Pegar todos os IDs únicos
    const productIds = grouped.map(g => g.productId);

    // Buscar dados dos produtos
    const products = await this.prisma.product.findMany({
      where: { code: { in: productIds } },
      select: { code: true, description: true }
    });

    // Montar resposta final
    return grouped.map(item => {
      const product = products.find(p => p.code === item.productId);

      return {
        id: item.productId,
        nome: product?.description ?? null,
        totalSold: item._sum.quantity,
        timesSold: item._count.productId
      }
    });
  }

  async productsSoldByState() {
    const result = await this.prisma.monthlyShipmentReport.groupBy({
      by: ['destination'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        }
      }
    });

    return result.map(item => ({
      state: item.destination,
      totalSold: item._sum.quantity,
    }));
  }


  // async mostProductsSold() {
  //   // 1. Agrupa os produtos
  //   const grouped = await this.prisma.monthlyShipmentReport.groupBy({
  //     by: ['productId'],
  //     _count: { productId: true },
  //     _sum: { quantity: true },
  //     orderBy: { _sum: { quantity: 'desc' } },
  //     take: 5,
  //   });

  //   // 2. Busca os produtos com JOIN
  //   const productIds = grouped.map(g => g.productId);

  //   const products = await this.prisma.product.findMany({
  //     where: { id: { in: productIds } },
  //   });

  //   // 3. Junta os dados (INNER JOIN manual)
  //   return grouped.map(g => ({
  //     productId: g.productId,
  //     productName: products.find(p => p.id === g.productId)?.name ?? 'Desconhecido',
  //     totalSold: g._sum.quantity,
  //     timesSold: g._count.productId,
  //   }));
  // }

}
