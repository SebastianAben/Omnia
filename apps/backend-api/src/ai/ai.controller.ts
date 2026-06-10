import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import type { CurrentUser } from "../auth/dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AiInsightQuery, aiInsightQuerySchema } from "./ai.dto";
import { AiService } from "./ai.service";

type RequestWithUser = {
  user: CurrentUser;
};

@ApiTags("ai")
@Controller("ai")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("insights")
  @ApiOkResponse({
    description: "LLM advisory insights for HQ and analyst roles.",
  })
  insights(
    @Req() request: RequestWithUser,
    @Query(new ZodValidationPipe(aiInsightQuerySchema)) query: AiInsightQuery,
  ) {
    this.assertCanReadAi(request.user);

    return this.aiService.listInsights(query, request.user.role_code);
  }

  @Post("insights/generate")
  @ApiOkResponse({
    description: "Trigger LLM insight generation for HQ and analyst roles.",
  })
  generateInsights(@Req() request: RequestWithUser) {
    this.assertCanReadAi(request.user);

    return this.aiService.generateInsights();
  }

  @Get("generation-jobs")
  @ApiOkResponse({ description: "Recent LLM insight generation jobs." })
  generationJobs(@Req() request: RequestWithUser) {
    this.assertCanReadAi(request.user);

    return this.aiService.listGenerationJobs();
  }

  @Get("insights/low-stock")
  @ApiOkResponse({ description: "Low stock advisory insights." })
  lowStock(
    @Req() request: RequestWithUser,
    @Query("branch_id") branchId?: string,
  ) {
    this.assertCanReadAi(request.user);

    return this.aiService.listInsights(
      {
        branch_id: branchId,
        insight_type: "low_stock_alert",
      },
      request.user.role_code,
    );
  }

  @Get("insights/stockout-predictions")
  @ApiOkResponse({ description: "Baseline stockout prediction insights." })
  stockoutPredictions(
    @Req() request: RequestWithUser,
    @Query("branch_id") branchId?: string,
  ) {
    this.assertCanReadAi(request.user);

    return this.aiService.listInsights(
      {
        branch_id: branchId,
        insight_type: "stockout_prediction",
      },
      request.user.role_code,
    );
  }

  private assertCanReadAi(user: CurrentUser) {
    const role = user.role_code.toLowerCase();

    if (role.includes("cashier") || role.includes("supervisor")) {
      throw new ForbiddenException(
        "LLM insights are available for HQ Admin and Executive / Analyst roles",
      );
    }
  }
}
