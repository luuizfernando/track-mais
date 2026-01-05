import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import { PrismaService } from "src/prisma/prisma.service";
import jwtConfig from "./config/jwt.config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { SignInDto } from "./dto/signin.dto";
import { BcryptService } from "./hash/bcrypt.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly hashingService: BcryptService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService,
  ) {}

  async Authenticate(signInDto: SignInDto) {
    const user = await this.prisma.users.findFirst({
      where: {
        username: signInDto.username,
        active: true,
      },
    });

    if (!user) {
      throw new HttpException(
        "Falha ao autenticar o usuário.",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const passwordIsValid = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );
    if (!passwordIsValid) {
      throw new HttpException(
        "Usuário ou Senha incorretos.",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = await this.jwtService.signAsync(
      {
        // garanta tipo primitivo
        sub: Number(user.id),
        username: user.username,
        role: user.role,
      },
      {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.getExpiresIn(), // agora sempre number (segundos)
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      },
    );

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      active: user.active,
      role: user.role,
      token,
    };
  }

  // Converte '30d', '12h', '15m', '10s' ou '3600' -> número em segundos
  private getExpiresIn(): JwtSignOptions["expiresIn"] {
    const ttl = this.jwtConfiguration.jwtTtl; // pode vir string ou number
    if (ttl == null) return undefined;

    if (typeof ttl === "number") return ttl;

    const s = String(ttl).trim();

    // formato com unidade (s|m|h|d)
    const m = s.match(/^(\d+)\s*([smhd])$/i);
    if (m) {
      const value = Number(m[1]);
      const unit = m[2].toLowerCase();
      const factor =
        unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400; // d
      return value * factor;
    }

    // número em string (segundos)
    const n = Number(s);
    if (!Number.isNaN(n)) return n;

    // fallback: 1 dia
    return 86400;
  }
}
