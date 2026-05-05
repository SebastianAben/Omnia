import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("branches")
@Controller("branches")
export class BranchesController {
  @Get()
  @ApiOkResponse({ description: "Branch module skeleton for Sprint 0." })
  listBranches() {
    return {
      success: true,
      data: [],
      meta: {
        module: "branches",
        status: "skeleton",
      },
    };
  }
}
