import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthGuard } from "../auth/guards/auth.guard";
import { HqAdminGuard } from "../auth/guards/hq-admin.guard";
import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("users")
@UseGuards(AuthGuard, HqAdminGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({ description: "List active users with role and branch scope." })
  listUsers() {
    return this.usersService.listUsers();
  }
}
