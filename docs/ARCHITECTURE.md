# 🎮 MITRON ARCADE — PROJECT ARCHITECTURE & IMPLEMENTATION GUIDE

## 1. Project Overview & Elevator Pitch
**Mitron Arcade** is a full-stack, cloud-ready web application hosting three interactive games: **Tic-Tac-Toe**, **Snake Island**, and **Memory Match**. It merges a high-performance Java (Spring Boot) backend with a responsive, modern HTML5/CSS3/JavaScript frontend with a tropical beach-arcade aesthetic ("Beach Buggy" vibe).

The platform includes:
- **Authentication & Security**: Stateless JWT-based authentication with BCrypt password hashing.
- **Persistent High Scores**: Unified leaderboard system tracking user personal records across all games.
- **Dynamic Frontend Architecture**: Single-Page Application (SPA) structure, modular JavaScript game engines, and Web Audio API synthesis for zero-latency procedural sound effects.
- **Multi-Environment Persistence**: Flexible database tier supporting local MySQL or containerized/embedded H2 without external dependencies.
- **Containerization & Deployment**: Dockerized multi-stage build configured for zero-configuration cloud hosting (Render).

---

## 2. Technology Stack & Key Decisions

| Layer | Technologies Used | Architectural Justification |
| :--- | :--- | :--- |
| **Backend Framework** | Spring Boot 3.2.0, Java 17 | Rapid micro-service development, robust dependency injection, production readiness. |
| **Security Layer** | Spring Security 6, JJWT (0.11.5) | Stateless session management, token validation via `OncePerRequestFilter`, decoupled CORS. |
| **Data Access** | Spring Data JPA / Hibernate 6 | ORM abstraction, automated schema creation/updating, custom JPQL queries. |
| **Databases** | MySQL 8.0 & H2 Database | MySQL for production durability; embedded H2 for self-contained, zero-cloud deployments. |
| **Frontend UI** | HTML5, Modern CSS3 (Grid/Flexbox/Gradients) | Native performance, dark-mode tropical aesthetic, fully responsive across mobile & desktop. |
| **Client Game Engines** | Vanilla ECMAScript (ES6 Modules) | Zero external bundlers/dependencies required, clean component isolation (`TTT`, `Snake`, `Memory`). |
| **Sound Synthesis** | Web Audio API (`AudioContext`, Oscillators) | Low-latency audio feedback generated on the fly without heavy MP3/WAV assets. |
| **DevOps & Packaging** | Docker (Multi-stage build), Maven | Lean runtime image (~180MB JRE), cached layer dependency downloads. |

---

## 3. High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                               CLIENT (BROWSER)                                  |
|                                                                                 |
|   index.html (SPA Dashboard & Dynamic Viewport)                                 |
|         |                                                                       |
|   +-----+---------------------------------------------------------------+       |
|   | app.js (Auth, Nav, Toast, Leaderboard Sync)                         |       |
|   | sound.js (Web Audio Synthesis: clicks, eat, win, crash)             |       |
|   +---------------------------------------------------------------------+       |
|         |                        |                        |                     |
|   +-----------+            +-----------+            +-----------+               |
|   |  ttt.js   |            | snake.js  |            | memory.js |               |
|   | (Grid ES) |            | (Canvas)  |            | (3D Flip) |               |
|   +-----------+            +-----------+            +-----------+               |
+---------|------------------------|------------------------|---------------------+
          |                        |                        |
          +------------------------+------------------------+
                                   | HTTP REST (JSON) + Bearer JWT
                                   v
+---------------------------------------------------------------------------------+
|                       SPRING BOOT BACKEND (:8080)                               |
|                                                                                 |
|   SecurityFilterChain -> JwtAuthFilter -> CorsFilter                           |
|                                   |                                             |
|   +-------------------------------+-------------------------------+             |
|   | AuthController (/api/auth)    | ScoreController (/api/scores) |             |
|   +-------------------------------+-------------------------------+             |
|   | UserService                   | ScoreService                  |             |
|   +-------------------------------+-------------------------------+             |
|   | UserRepository                | ScoreRepository               |             |
+-----------------------------------|---------------------------------------------+
                                    | Spring Data JPA / Hibernate
                                    v
+---------------------------------------------------------------------------------+
|                           DATABASE PERSISTENCE                                  |
|   - MySQL 8.0 (Local / Production)                                              |
|   - H2 Database (Containerized / Cloud Zero-Setup)                              |
|   Tables: `users`, `leaderboards`                                               |
+---------------------------------------------------------------------------------+
```

---

## 4. Database Schema Design

### 4.1 Schema Definition (`schema.sql`)
```sql
CREATE DATABASE IF NOT EXISTS `game_java`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `game_java`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email    (email)
) ENGINE=InnoDB;

-- 2. Leaderboards Table
CREATE TABLE IF NOT EXISTS leaderboards (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    game_name   VARCHAR(50)     NOT NULL,
    high_score  INT             NOT NULL DEFAULT 0,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_leaderboard_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_game (user_id, game_name),
    INDEX idx_game_score (game_name, high_score DESC)
) ENGINE=InnoDB;
```

### 4.2 Entity Relationships
- **User to Score**: One-to-Many (`@OneToMany` / `@ManyToOne`). A user has records across multiple games.
- **Unique Constraint (`uq_user_game`)**: Ensures that each user has exactly **one** consolidated high score per game type, keeping leaderboards compact and upsert logic efficient.
- **Index (`idx_game_score`)**: Composite index on `(game_name, high_score DESC)` ensures top-10 queries execute in logarithmic time $O(\log n)$ even under high user volume.

---

## 5. Backend Implementation Breakdown

### 5.1 Entities
- **`User.java`**: Represents players. Contains username, email, encrypted password, and timestamp creation hooks (`@PrePersist`).
- **`Score.java`**: Maps to `leaderboards`. Uses `@ManyToOne(fetch = FetchType.LAZY)` referencing the user, with `@PreUpdate` timestamp management.

### 5.2 Security & Authentication Flow
1. **Password Encryption**: Handled via `PasswordEncoderConfig.java` providing a `BCryptPasswordEncoder` bean.
2. **JWT Generation**: In `JwtUtil.java`, tokens are signed using HMAC-SHA256 (`Keys.hmacShaKeyFor`) containing subject username, issue date, and 24-hour expiration.
3. **Stateless Request Interception**:
   - Every request is intercepted by `jwtAuthFilter()` inside `SecurityConfig.java`.
   - The token is parsed from the `Authorization: Bearer <token>` header.
   - If valid, a `UsernamePasswordAuthenticationToken` is set into Spring's `SecurityContextHolder`.

### 5.3 REST API Endpoints
| HTTP Verb | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Registers user, validates uniqueness, returns JWT. |
| `POST` | `/api/auth/login` | No | Authenticates credentials, returns JWT token. |
| `POST` | `/api/scores/submit` | Yes (JWT) | Upserts player score if it exceeds current personal high score. |
| `GET` | `/api/scores/leaderboard/{gameName}` | No | Returns top 10 scores sorted descending by high score. |

---

## 6. Frontend & Game Engines

### 6.1 Theme & UI System (`index.html`)
- Built with a tropical beach-arcade dark theme inspired by *Beach Buggy*.
- Utilizes CSS custom properties, backdrop filters (`backdrop-filter: blur(16px)`), CSS grid layouts, and custom card-flip transformations.
- Dynamic responsive layout: Sidebar navigation transforms to compact icons on mobile devices; leaderboard switches seamlessly using tab triggers.

### 6.2 Pure JavaScript Game Modules
1. **Tic-Tac-Toe (`ttt.js`)**:
   - 2-player local mode.
   - State managed via an array of 9 cells.
   - Evaluates win combos via 8 pre-computed Cartesian vectors.
   - Submits cumulative winner score upon victory.
2. **Snake Island (`snake.js`)**:
   - Rendered using HTML5 2D Canvas context.
   - Dynamic game tick loop with speed acceleration every 50 points.
   - Prevents 180° direction reversal collisions.
   - Tracks personal best in client `localStorage` and submits to backend on death.
3. **Memory Match (`memory.js`)**:
   - 16-card 3D perspective flip board with 8 tropical emoji pairs.
   - Dynamic score calculation: $\text{Score} = \max(100, 1000 - (\text{moves} \times 10) - (\text{seconds} \times 2))$.
   - Automatically triggers victory sound track upon game completion.

### 6.3 Procedural Audio System (`sound.js`)
- Employs browser-native Web Audio API without requiring bulky audio file downloads.
- Generates procedural sine, triangle, and sawtooth waves for button taps, piece placements, snake bites, card flips, and game-over crashes.
- Integrates dedicated video-track audio extraction for the Memory Match celebration sequence.

---

## 7. Deployment & Containerization Architecture

### 7.1 Multi-Stage Dockerfile
```dockerfile
# Stage 1: Build & Dependency Caching
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```
**Benefits:**
- **Layer Caching**: Changes to source code do not re-download Maven dependencies.
- **Security & Footprint**: The final container contains only the minimal JRE runtime without compiler tools or Maven source trees.

### 7.2 Zero-Cloud Configuration (`render.yaml`)
Configured to boot with an embedded H2 database by default if cloud database credentials are not supplied, allowing 1-click deployment on platforms like Render or Railway.
