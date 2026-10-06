package com.ridgerunner.api;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RaceRunRepository extends JpaRepository<RaceRun, Long> {
    List<RaceRun> findTop5ByOrderByDistanceDescCompletedAtAsc();

    Optional<RaceRun> findFirstByOrderByDistanceDesc();
}