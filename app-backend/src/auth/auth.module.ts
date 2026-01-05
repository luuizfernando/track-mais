import { Global, Module } from "@nestjs/common";
import { BcryptService } from "./hash/bcrypt.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import jwtConfig from "./config/jwt.config";
import { JwtModule } from "@nestjs/jwt";

@Global()
@Module({
  imports: [
    PrismaModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  providers: [AuthService, BcryptService, AuthService],
  exports: [BcryptService, JwtModule, ConfigModule],
  controllers: [AuthController],
})
export class AuthModule {}
