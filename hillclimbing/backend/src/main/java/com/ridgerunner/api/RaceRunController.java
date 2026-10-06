package com.ridgerunner.api;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RaceRunController {
    private final RaceRunRepository runs;

    public RaceRunController(RaceRunRepository runs) {
        this.runs = runs;
    }

    @GetMapping("/leaderboard")
    public LeaderboardResponse leaderboard() {
        int personalBest = runs.findFirstByOrderByDistanceDesc()
                .map(RaceRun::getDistance)
                .orElse(0);
        List<RaceRunResponse> recentRuns = runs.findTop5ByOrderByDistanceDescCompletedAtAsc()
                .stream()
                .map(RaceRunResponse::from)
                .toList();
        return new LeaderboardResponse(personalBest, recentRuns);
    }

    @PostMapping("/runs")
    @ResponseStatus(HttpStatus.CREATED)
    public RaceRunResponse saveRun(@Valid @RequestBody RaceRunRequest request) {
        RaceRun run = runs.save(new RaceRun(request.distance(), request.coins(), request.reason()));
        return RaceRunResponse.from(run);
    }
}