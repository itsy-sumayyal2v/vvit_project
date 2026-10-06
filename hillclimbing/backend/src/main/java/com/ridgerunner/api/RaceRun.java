package com.ridgerunner.api;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "race_runs")
public class RaceRun {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int distance;

    @Column(nullable = false)
    private int coins;

    @Column(nullable = false, length = 32)
    private String reason;

    @Column(nullable = false)
    private Instant completedAt;

    protected RaceRun() {
    }

    public RaceRun(int distance, int coins, String reason) {
        this.distance = distance;
        this.coins = coins;
        this.reason = reason;
    }

    @PrePersist
    void setCompletedAt() {
        if (completedAt == null) {
            completedAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public int getDistance() {
        return distance;
    }

    public int getCoins() {
        return coins;
    }

    public String getReason() {
        return reason;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }
}