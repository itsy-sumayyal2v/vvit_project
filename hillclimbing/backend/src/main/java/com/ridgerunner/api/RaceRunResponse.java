package com.ridgerunner.api;

import java.time.Instant;

public record RaceRunResponse(Long id, int distance, int coins, String reason, Instant completedAt) {
    static RaceRunResponse from(RaceRun run) {
        return new RaceRunResponse(run.getId(), run.getDistance(), run.getCoins(), run.getReason(), run.getCompletedAt());
    }
}