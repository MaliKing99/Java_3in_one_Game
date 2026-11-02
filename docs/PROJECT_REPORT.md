# 📋 MITRON ARCADE — COMPLETE TECHNICAL REPORT & SPECIFICATION

**Author**: Full Stack Engineering Team  
**Project**: Mitron Multi-Game Platform  
**Target Architecture**: Java 17 / Spring Boot 3.2 / MySQL & H2 / Docker  

---

## 1. Executive Summary
Mitron Arcade is an enterprise-grade full-stack web gaming platform designed to demonstrate modern software architecture practices, secure RESTful API development, robust object-relational mapping, and interactive browser-based client experiences.

---

## 2. Directory Structure & File Map

```
full-stack-java/
├── database/
│   └── schema.sql                          # MySQL schema, table definitions & indexes
├── docs/                                   # Project presentation & architecture files
│   ├── ARCHITECTURE.md                     # Technical architecture documentation
│   ├── PRESENTATION_GUIDE.md               # Presentation slides & interview script
│   └── PROJECT_REPORT.md                   # Complete technical reference manual
├── pom.xml                                 # Maven configuration & dependency declarations
├── Dockerfile                              # Multi-stage container build specification
├── docker-compose.yml                      # Multi-container orchestration (App + MySQL)
├── render.yaml                             # Cloud blueprint for Render deployment
└── src/
    └── main/
        ├── java/com/gameplatform/
        │   ├── GamePlatformApplication.java# Spring Boot entry point
        │   ├── config/
        │   │   ├── JwtUtil.java            # JWT generation, claim parsing & validation
        │   │   ├── PasswordEncoderConfig.java # Decoupled BCrypt password encoder
        │   │   └── SecurityConfig.java     # Security filter chain, CORS & JWT filter
        │   ├── controller/
        │   │   ├── AuthController.java     # /api/auth/register, /api/auth/login
        │   │   └── ScoreController.java    # /api/scores/submit, /api/scores/leaderboard
        │   ├── dto/
        │   │   ├── AuthRequest.java        # Login request payload
        │   │   ├── AuthResponse.java       # JWT token & user response payload
        │   │   └── ScoreRequest.java       # Score submission payload with validation
        │   ├── entity/
        │   │   ├── User.java               # JPA Entity for `users` table
        │   │   └── Score.java              # JPA Entity for `leaderboards` table
        │   ├── repository/
        │   │   ├── UserRepository.java     # User data access layer
        │   │   └── ScoreRepository.java    # Score data access layer + top-10 JPQL
        │   └── service/
        │       ├── UserService.java        # User registration & UserDetailsService
        │       └── ScoreService.java       # High score upsert business logic
        └── resources/
            ├── application.properties      # Central runtime configuration
            └── static/
                ├── index.html              # Frontend dashboard & game viewports
                ├── assets/
                │   ├── beach-bg.jpg        # Tropical beach background artwork
                │   └── memory-win-video.mp4# Video asset containing victory audio
                └── js/
                    ├── sound.js            # Web Audio API procedural sound engine
                    ├── app.js              # Platform controller, auth & navigation
                    ├── ttt.js              # Tic-Tac-Toe game module
                    ├── snake.js            # Snake Island canvas game module
                    └── memory.js           # Memory Match 3D card flip game module
```

---

## 3. Core Modules & Code Mechanisms

### 3.1 Security & Authentication Workflow
1. User provides credentials to `/api/auth/login`.
2. `AuthenticationManager` authenticates against `UserService` using BCrypt.
3. Upon success, `JwtUtil` issues an encrypted token signed with HMAC-SHA256 containing a 24-hour TTL.
4. Subsequent requests pass `Authorization: Bearer <token>`.
5. `SecurityConfig`'s `jwtAuthFilter` intercepts the request, validates the signature, extracts the username, and attaches the authenticated principal to the thread context.

### 3.2 High Score Upsert Logic
In `ScoreService.java`:
```java
@Transactional
public Score submitScore(String username, String gameName, int score) {
    User user = userService.findByUsername(username);
    Optional<Score> existing = scoreRepository.findByUserAndGameName(user, gameName);

    if (existing.isPresent()) {
        Score s = existing.get();
        // Update only if the new score surpasses previous personal best
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
```

### 3.3 Audio Synthesis via Web Audio API
Rather than requesting audio files across the network, `sound.js` synthesizes sounds procedurally:
- **Tone Generation**: Creates an `OscillatorNode` connected to a `GainNode`.
- **Envelope Shaping**: `gain.gain.exponentialRampToValueAtTime` creates realistic percussive attack and decay curves.
- **Victory Audio**: Links directly to the HTML5 `<audio id="memory-win-audio">` to stream the celebration soundtrack without rendering video frames.

---

## 4. Setup, Run & Test Instructions

### Local Development (Maven)
```bash
# 1. Clone repository
git clone https://github.com/MaliKing99/Java_3in_one_Game.git
cd Java_3in_one_Game

# 2. Package and run locally
mvn clean package -DskipTests
java -jar target/game-platform-1.0.0.jar
```
Navigate to: `http://localhost:8080`

### Local Docker Build & Run
```bash
docker build -t mitron-arcade .
docker run -p 8080:8080 mitron-arcade
```

---

## 5. Security & Production Hardening Checklist
- [x] Passwords hashed with BCrypt (10 rounds).
- [x] Stateless JWT authentication (no server memory leaks or session hijacking).
- [x] Cross-Site Scripting (XSS) mitigated through sanitized DOM bindings.
- [x] SQL Injection prevented via Hibernate parameter binding & prepared statements.
- [x] Multi-stage Docker container runs unprivileged minimal JRE image.
- [x] CORS properly configured with preflight handling.
