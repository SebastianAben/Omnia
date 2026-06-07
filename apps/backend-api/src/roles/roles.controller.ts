import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthGuard } from "../auth/guards/auth.guard";
import { HqAdminGuard } from "../auth/guards/hq-admin.guard";
import { RolesService } from "./roles.service";

@ApiTags("roles")
@Controller("roles")
@UseGuards(AuthGuard, HqAdminGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOkResponse({ description: "List active MVP roles." })
  listRoles() {
    return this.rolesService.listRoles();
  }
}
