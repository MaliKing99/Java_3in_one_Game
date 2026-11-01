package com.gameplatform.controller;

import com.gameplatform.dto.ScoreRequest;
import com.gameplatform.entity.Score;
import com.gameplatform.service.ScoreService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/scores")
@CrossOrigin
public class ScoreController {

    private final ScoreService scoreService;

    public ScoreController(ScoreService scoreService) {
        this.scoreService = scoreService;
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitScore(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ScoreRequest req) {
        Score saved = scoreService.submitScore(userDetails.getUsername(), req.getGameName(), req.getScore());
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Score submitted");
        response.put("highScore", saved.getHighScore());
        response.put("gameName", saved.getGameName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/leaderboard/{gameName}")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(@PathVariable String gameName) {
        List<Score> scores = scoreService.getLeaderboard(gameName);
        List<Map<String, Object>> result = scores.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("rank", scores.indexOf(s) + 1);
            map.put("username", s.getUser() != null ? s.getUser().getUsername() : "Anonymous");
            map.put("score", s.getHighScore());
            map.put("updatedAt", s.getUpdatedAt() != null ? s.getUpdatedAt().toString() : "");
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
