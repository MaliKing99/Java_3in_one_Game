package com.gameplatform.service;

import com.gameplatform.entity.Score;
import com.gameplatform.entity.User;
import com.gameplatform.repository.ScoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ScoreService {

    private final ScoreRepository scoreRepository;
    private final UserService userService;

    public ScoreService(ScoreRepository scoreRepository, UserService userService) {
        this.scoreRepository = scoreRepository;
        this.userService = userService;
    }

    @Transactional
    public Score submitScore(String username, String gameName, int score) {
        User user = userService.findByUsername(username);
        Optional<Score> existing = scoreRepository.findByUserAndGameName(user, gameName);

        if (existing.isPresent()) {
            Score s = existing.get();
            if (score > s.getHighScore()) {
                s.setHighScore(score);
                return scoreRepository.save(s);
            }
            return s;
        } else {
            Score newScore = new Score();
            newScore.setUser(user);
            newScore.setGameName(gameName);
            newScore.setHighScore(score);
            return scoreRepository.save(newScore);
        }
    }

    public List<Score> getLeaderboard(String gameName) {
        return scoreRepository.findTop10ByGameName(gameName);
    }
}
