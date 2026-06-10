export type AiGenerationTone = "neutral" | "success" | "warning" | "danger";

export type AiGenerationUiState = {
  tone: AiGenerationTone;
  label: string;
  detail: string;
  finishedAt?: string;
};

export function getAiGenerationUiState(input: {
  status?: string;
  insightCount?: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  finishedAt?: string | null;
}): AiGenerationUiState {
  const insightCount = input.insightCount ?? 0;

  if (!input.status) {
    return {
      tone: "neutral",
      label: "No generation yet",
      detail: "LLM insights have not been generated for this view.",
      finishedAt: input.finishedAt ?? undefined,
    };
  }

  if (input.status === "success") {
    return {
      tone: "success",
      label: "Generation succeeded",
      detail: `${insightCount} advisory insights are available.`,
      finishedAt: input.finishedAt ?? undefined,
    };
  }

  if (input.status === "cached") {
    return {
      tone: "neutral",
      label: "Fresh cached insights",
      detail: `${insightCount} advisory insights were reused without a provider call.`,
      finishedAt: input.finishedAt ?? undefined,
    };
  }

  if (input.status === "insufficient_data") {
    return {
      tone: "warning",
      label: "Insufficient central data",
      detail: "Central sales and inventory context is not yet enough for useful predictions.",
      finishedAt: input.finishedAt ?? undefined,
    };
  }

  if (input.status === "processing") {
    return {
      tone: "neutral",
      label: "Generation processing",
      detail: "LLM generation is still running.",
      finishedAt: input.finishedAt ?? undefined,
    };
  }

  const knownErrors: Record<string, Omit<AiGenerationUiState, "finishedAt">> = {
    LLM_API_KEY_MISSING: {
      tone: "danger",
      label: "Missing API key",
      detail: "LLM_API_KEY is not configured on the backend.",
    },
    LLM_PROVIDER_TIMEOUT: {
      tone: "danger",
      label: "Provider timeout",
      detail: "The LLM provider timed out before returning a validated response.",
    },
    LLM_PROVIDER_ERROR: {
      tone: "danger",
      label: "Provider error",
      detail:
        input.errorMessage ??
        "The LLM provider returned an error. Check key, model, quota, or backend connectivity.",
    },
    LLM_OUTPUT_INVALID: {
      tone: "warning",
      label: "Invalid output rejected",
      detail: "The LLM output did not match the required schema and was not saved.",
    },
    LLM_OUTPUT_UNSAFE: {
      tone: "warning",
      label: "Unsafe output rejected",
      detail: "The LLM output requested an operational mutation and was not saved.",
    },
  };
  const mapped = knownErrors[input.errorCode ?? ""];

  if (mapped) {
    return {
      ...mapped,
      finishedAt: input.finishedAt ?? undefined,
    };
  }

  return {
    tone: "danger",
    label: "Generation failed",
    detail: input.errorMessage ?? "LLM generation failed in a controlled state.",
    finishedAt: input.finishedAt ?? undefined,
  };
}
