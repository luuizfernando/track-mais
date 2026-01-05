import { PrismaService } from "src/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PaginationDto } from "src/common/dto/pagination.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const findCode = await this.prisma.product.findFirst({
        where: {
          code: Number(createProductDto.code),
        },
      });

      if (findCode && Number(createProductDto.code) === Number(findCode.code)) {
        throw new HttpException("Esse produto já existe.", HttpStatus.CONFLICT);
      }

      await this.prisma.product.create({
        data: {
          code: Number(createProductDto.code),
          description: createProductDto.description,
          group: createProductDto.group,
          company: createProductDto.company,
        },
      });

      return { message: "Produto cadastrado com sucesso!" };
    } catch (err) {
      console.log(err);
      if (err.status === 409) {
        throw new HttpException("Esse produto já existe.", HttpStatus.CONFLICT);
      }

      throw new HttpException(
        "Erro ao cadastrar produto.",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    try {
      const [products, total] = await this.prisma.$transaction([
        this.prisma.product.findMany({
          skip: offset,
          take: limit,
          orderBy: { code: "desc" } as any,
        } as any),
        this.prisma.product.count(),
      ]);

      return {
        data: products,
        limit,
        offset,
        total,
      };
    } catch (err) {
      throw new HttpException(
        "Erro ao buscar produtos.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findOne(id: number) {
    try {
      const code = BigInt(id);
      return this.prisma.product.findUnique({ where: { code } });
    } catch (err) {
      throw new HttpException(
        "Erro ao buscar produto.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return this.prisma
      .$transaction(async (tx) => {
        const code = BigInt(id);
        const product = await tx.product.findUnique({ where: { code } });
        if (!product) {
          throw new HttpException(
            "Esse produto não existe.",
            HttpStatus.NOT_FOUND,
          );
        }
        const updated = await tx.product.update({
          where: { code },
          data: {
            description: updateProductDto?.description ?? product.description,
            group: updateProductDto?.group ?? product.group,
            company: updateProductDto?.company ?? product.company,
          },
        });
        return { updated, message: "Produto atualizado com sucesso!" };
      })
      .catch((err) => {
        if (err instanceof HttpException) throw err;
        throw new HttpException(
          "Falha ao atualizar produto.",
          HttpStatus.BAD_REQUEST,
        );
      });
  }

  async remove(id: number) {
    try {
      const code = BigInt(id);

      const product = await this.prisma.product.findUnique({
        where: { code },
      });

      if (!product) {
        throw new HttpException(
          "Esse produto não existe.",
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.product.delete({
        where: { code },
      });

      return { message: "Produto deletado com sucesso!" };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(
        "Falha ao deletar produto.",
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
