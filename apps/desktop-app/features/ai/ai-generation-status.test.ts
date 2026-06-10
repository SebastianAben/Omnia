import assert from "node:assert/strict";
import test from "node:test";

import { getAiGenerationUiState } from "./ai-generation-status";

test("getAiGenerationUiState maps success and cached to non-error states", () => {
  assert.deepEqual(
    getAiGenerationUiState({ status: "success", insightCount: 3 }),
    {
      tone: "success",
      label: "Generation succeeded",
      detail: "3 advisory insights are available.",
      finishedAt: undefined,
    },
  );

  assert.equal(
    getAiGenerationUiState({ status: "cached", insightCount: 2 }).tone,
    "neutral",
  );
});

test("getAiGenerationUiState maps insufficient data to a warning state", () => {
  const result = getAiGenerationUiState({
    status: "insufficient_data",
    insightCount: 0,
  });

  assert.equal(result.tone, "warning");
  assert.equal(result.label, "Insufficient central data");
});

test("getAiGenerationUiState maps missing key and provider failures to controlled errors", () => {
  assert.equal(
    getAiGenerationUiState({
      status: "failed",
      errorCode: "LLM_API_KEY_MISSING",
    }).detail,
    "LLM_API_KEY is not configured on the backend.",
  );
  assert.equal(
    getAiGenerationUiState({
      status: "failed",
      errorCode: "LLM_PROVIDER_TIMEOUT",
    }).label,
    "Provider timeout",
  );
  assert.equal(
    getAiGenerationUiState({
      status: "failed",
      errorCode: "LLM_OUTPUT_UNSAFE",
    }).label,
    "Unsafe output rejected",
  );
});
