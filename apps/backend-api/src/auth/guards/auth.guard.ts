import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { AuthService } from "../auth.service";
import { CurrentUser } from "../dto";

type RequestWithUser = {
  headers: Record<string, string | string[] | undefined>;
  user?: CurrentUser;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;
    const token = Array.isArray(authorization)
      ? authorization[0]
      : authorization;

    if (!token?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Bearer token is required");
    }

    request.user = this.authService.verifyToken(token.slice("Bearer ".length));

    return true;
  }
}
