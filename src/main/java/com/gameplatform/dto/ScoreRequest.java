package com.gameplatform.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ScoreRequest {
    @NotBlank
    private String gameName;

    @NotNull
    @Min(0)
    private Integer score;

    public ScoreRequest() {
    }

    public ScoreRequest(String gameName, Integer score) {
        this.gameName = gameName;
        this.score = score;
    }

    public String getGameName() {
        return gameName;
    }

    public void setGameName(String gameName) {
        this.gameName = gameName;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }
}
