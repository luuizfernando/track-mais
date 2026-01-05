import { Body, Controller, Post } from "@nestjs/common";
import { SignInDto } from "./dto/signin.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  SignIn(@Body() signInDto: SignInDto) {
    return this.authService.Authenticate(signInDto);
  }
}
