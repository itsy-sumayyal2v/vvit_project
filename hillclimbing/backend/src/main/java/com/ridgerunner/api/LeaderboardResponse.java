package com.ridgerunner.api;

import java.util.List;

public record LeaderboardResponse(int personalBest, List<RaceRunResponse> runs) {
}