import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthService } from "./auth.service";
import { CurrentUser, LoginDto } from "./dto";
import { AuthGuard } from "./guards/auth.guard";

type AuthenticatedRequest = Request & {
  user: CurrentUser;
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("login")
  @ApiOkResponse({ description: "Login skeleton response for Sprint 0." })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Current authenticated user skeleton." })
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.user);
  }
}
