import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

@Injectable()
export class ZodValidationPipe<TInput, TOutput>
  implements PipeTransform<TInput, TOutput>
{
  constructor(private readonly schema: ZodType<TOutput, TInput>) {}

  transform(value: TInput): TOutput {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }

    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      errors: result.error.flatten().fieldErrors,
    });
  }
}
