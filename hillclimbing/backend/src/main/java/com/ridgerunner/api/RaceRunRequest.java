package com.ridgerunner.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RaceRunRequest(
        @Min(0) @Max(10_000_000) int distance,
        @Min(0) @Max(1_000_000) int coins,
        @NotBlank @Size(max = 32) String reason) {
}