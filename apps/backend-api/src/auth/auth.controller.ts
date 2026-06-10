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

import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthService } from "./auth.service";
import {
  CurrentUser,
  LoginDto,
  loginSchema,
  RefreshSessionDto,
  refreshSessionSchema,
} from "./dto";
import { AuthGuard } from "./guards/auth.guard";

type AuthenticatedRequest = Request & {
  user: CurrentUser;
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("login")
  @ApiOkResponse({ description: "Login response with bearer token." })
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  @ApiOkResponse({ description: "Rotated access and refresh tokens." })
  refresh(
    @Body(new ZodValidationPipe(refreshSessionSchema))
    dto: RefreshSessionDto,
  ) {
    return this.authService.refreshSession(dto);
  }

  @Post("logout")
  @ApiOkResponse({ description: "Revokes the supplied refresh session." })
  logout(
    @Body(new ZodValidationPipe(refreshSessionSchema))
    dto: RefreshSessionDto,
  ) {
    return this.authService.logout(dto);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Current authenticated user." })
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.user);
  }
}
