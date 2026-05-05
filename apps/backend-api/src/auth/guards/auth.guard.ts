import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { CurrentUser } from "../dto";

type RequestWithUser = {
  headers: Record<string, string | string[] | undefined>;
  user?: CurrentUser;
};

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;
    const token = Array.isArray(authorization)
      ? authorization[0]
      : authorization;

    if (!token?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Bearer token is required");
    }

    request.user = {
      id: "usr_demo",
      full_name: "Demo User",
      role_code: "cashier",
      branch_id: "br_demo",
    };

    return true;
  }
}
