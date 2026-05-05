import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { CurrentUser } from "../dto";

type RequestWithUser = {
  user?: CurrentUser;
};

@Injectable()
export class HqAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (request.user?.role_code !== "hq_admin") {
      throw new ForbiddenException("HQ Admin role is required");
    }

    return true;
  }
}
