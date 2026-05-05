import { Controller, Get, Inject } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { appConfig } from "../config/app.config";

type HealthResponse = {
  success: true;
  data: {
    status: "ok";
    service: "backend-api";
    version: string;
  };
};

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  @Get()
  @ApiOkResponse({ description: "Backend deployment health check." })
  getHealth(): HealthResponse {
    return {
      success: true,
      data: {
        status: "ok",
        service: "backend-api",
        version: this.config.version,
      },
    };
  }
}
