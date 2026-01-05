import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { request, Request } from "express";
import jwtConfig from "../config/jwt.config";
import type { ConfigType } from "@nestjs/config";
import { REQUEST_TOKEN_PAYLOAD_NAME } from "../common/auth.constants";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AuthTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requeste: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenheader(requeste);

    if (!token) {
      throw new UnauthorizedException("Token não encontrado!");
    }

    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        this.jwtConfiguration,
      );

      request[REQUEST_TOKEN_PAYLOAD_NAME] = payload;
      const user = await this.prisma.users.findFirst({
        where: {
          id: payload?.sub,
        },
      });

      if (!user?.active) {
        throw new UnauthorizedException("Acesso não autorizado.");
      }
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException("Acesso não autorizado.");
    }

    return true;
  }

  extractTokenheader(request: Request) {
    const authorization = request.headers?.authorization;

    if (!authorization || typeof authorization !== "string") {
      return;
    }

    return authorization.replace("Bearer ", "");
  }
}
