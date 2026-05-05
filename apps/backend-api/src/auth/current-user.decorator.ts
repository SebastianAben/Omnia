import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { CurrentUser } from "./dto";

type RequestWithUser = {
  user?: CurrentUser;
};

export const RequestUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUser | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
