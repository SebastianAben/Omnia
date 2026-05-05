import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { RegistersService } from "./registers.service";

@ApiTags("registers")
@Controller("registers")
export class RegistersController {
  constructor(private readonly registersService: RegistersService) {}

  @Get()
  @ApiOkResponse({ description: "List active registers by branch." })
  listRegisters() {
    return this.registersService.listRegisters();
  }
}
