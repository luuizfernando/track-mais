import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { BcryptService } from "src/auth/hash/bcrypt.service";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcryptService: BcryptService,
  ) {}

  // Create user
  async create(createUserDto: CreateUserDto) {
    try {
      const findUserName = await this.prisma.users.findFirst({
        where: {
          username: createUserDto.username,
        },
      });

      if (createUserDto.username === findUserName?.username) {
        throw new HttpException(
          "Esse nome de usuário já existe.",
          HttpStatus.CONFLICT,
        );
      }

      const passwordHash = await this.bcryptService.hash(
        createUserDto.password,
      );

      await this.prisma.users.create({
        data: {
          name: createUserDto.name,
          username: createUserDto.username,
          password: passwordHash,
          role: createUserDto.role,
        },
      });

      return { message: "Usuário registrado com sucesso!" };
    } catch (err) {
      console.log(err);
      if (err.status === 409) {
        throw new HttpException(
          "Esse nome de usuário já existe.",
          HttpStatus.CONFLICT,
        );
      }

      throw new HttpException(
        "Erro ao cadastrar usuário.",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  //Get all users
  async findAll(paginationDto: PaginationDto) {
    const { limit = 13, offset = 0 } = paginationDto;

    try {
      const data = await this.prisma.$transaction([
        this.prisma.users.findMany({
          skip: offset,
          take: limit,
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            active: true,
          },
        }),
      ]);

      return {
        data,
        limit,
        offset,
      };
    } catch (err) {
      throw new HttpException(
        "Erro ao buscar usuários",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //update user
  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          id: id,
        },
      });

      if (!user) {
        throw new HttpException(
          "Esse usuário não existe.",
          HttpStatus.NOT_FOUND,
        );
      }

      const dataUser: { password?: string } = {};

      if (updateUserDto?.password) {
        const passwordHash = await this.bcryptService.hash(
          updateUserDto.password,
        );
        dataUser["password"] = passwordHash;
      }

      const updateUser = await this.prisma.users.update({
        where: {
          id: user.id,
        },
        data: {
          name: updateUserDto.name ?? user.name,
          username: updateUserDto.username ?? user.username,
          password: dataUser.password ?? user.password,
          role: updateUserDto?.role ?? user.role,
        },
        select: {
          name: true,
          username: true,
          role: true,
        },
      });

      return {
        updateUser,
        message: "Usuario Atualizado com sucesso!",
      };
    } catch (err) {
      throw new HttpException(
        "Falha ao atualizar usuário.",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  //Delete user
  async delete(id: number) {
    try {
      const findUser = await this.prisma.users.findFirst({
        where: {
          id: id,
        },
      });

      if (!findUser) {
        throw new HttpException(
          "Esse usuário não existe.",
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.users.delete({
        where: {
          id: findUser.id,
        },
      });

      return { message: "Usuário deletado com sucesso!" };
    } catch (err) {
      throw new HttpException(
        "Falha ao deletar usuário.",
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
