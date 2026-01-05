import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { REQUEST_TOKEN_PAYLOAD_NAME } from "src/auth/common/auth.constants";

@Injectable()
export class AdminRolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const payload = request[REQUEST_TOKEN_PAYLOAD_NAME];

    console.log(payload);

    if (!payload) {
      throw new HttpException("Token inválido.", HttpStatus.BAD_REQUEST);
    }

    if (payload.role !== "admin") {
      throw new HttpException("Acesso Negado.", HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
