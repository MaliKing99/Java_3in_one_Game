package com.gameplatform.repository;

import com.gameplatform.entity.Score;
import com.gameplatform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {

    @Query("SELECT s FROM Score s JOIN FETCH s.user WHERE s.gameName = :gameName ORDER BY s.highScore DESC LIMIT 10")
    List<Score> findTop10ByGameName(@Param("gameName") String gameName);

    Optional<Score> findByUserAndGameName(User user, String gameName);
}
