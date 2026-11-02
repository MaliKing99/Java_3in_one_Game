# 🎤 MITRON ARCADE — PRESENTATION SCRIPT & SLIDE DECK

This guide is designed for presenting the project to interviewers, evaluators, or client stakeholders. It includes slide-by-slide breakdowns, speaking notes, and expected technical Q&A.

---

## 📽️ SLIDE 1: Title & Hook
- **Slide Title**: *Mitron Arcade — Full-Stack Multi-Game Platform*
- **Subtitle**: *Modern Java Microarchitecture meets Real-Time Web Arcade*
- **Key Visual**: Screenshot of Dashboard with the Tropical Beach theme.

### 🎙️ Speaker Script:
> "Hello everyone. Today I'm presenting **Mitron Arcade**, a full-stack, cloud-native gaming platform hosting three classic arcade titles: Tic-Tac-Toe, Snake Island, and Memory Match.
>
> Rather than just building simple web games, my objective was to engineer a robust, end-to-end production architecture: combining a modern Spring Boot REST backend with JWT security, resilient database persistence, procedural sound synthesis, and multi-stage containerized deployment."

---

## 📽️ SLIDE 2: Problem Statement & Engineering Goals
- **Key Challenges Addressed**:
  1. *Decoupled Architecture*: Clean separation between stateless server APIs and dynamic client viewports.
  2. *Security & Session Management*: Securing leaderboard submissions while avoiding server-side session bloat.
  3. *Zero-Latency Audio & Assets*: Providing arcade sound effects without heavy asset payloads.
  4. *Portability*: Running identically on a local developer machine, Docker container, or cloud host without requiring external database provisioning.

---

## 📽️ SLIDE 3: Architecture & System Design
- **Slide Diagram**: 3-Tier Architecture (Client SPA $\to$ Spring Security JWT Filter $\to$ REST Controllers $\to$ JPA $\to$ DB).

### 🎙️ Speaker Script:
> "Let's look at the system design. The frontend is a responsive Single Page Application. Communication with the backend occurs entirely over asynchronous JSON REST endpoints.
>
> On the backend, we run Java 17 and Spring Boot 3.2. Security is implemented via Spring Security and JJWT. When a user registers or logs in, the backend issues an HMAC-SHA256 encrypted JWT token.
>
> For state updates—such as when a player achieves a high score in Snake—the client issues an authenticated `POST` request with the Bearer token. The server verifies the token statelessly in an interceptor filter before passing it to our service layer."

---

## 📽️ SLIDE 4: Database Schema & Optimization
- **Key Tables**: `users` and `leaderboards`.
- **Database Support**: Dual-mode (MySQL 8.0 for production / H2 embedded for containerized zero-cloud runs).

### 🎙️ Speaker Script:
> "In designing the database schema, efficiency was the main priority:
> 1. We enforced a unique compound key on `(user_id, game_name)` in the leaderboards table. This means each player maintains a single record per game that gets updated via an upsert pattern only when they beat their personal best.
> 2. We created a composite descending index on `(game_name, high_score DESC)`. This guarantees that queries retrieving the top-10 leaderboard execute with minimal latency even with millions of records."

---

## 📽️ SLIDE 5: Frontend Experience & Sound Engine
- **Visuals**: Theme styling, Canvas game, and 3D card flips.
- **Key Technologies**: HTML5, Modern CSS Grid/Flexbox, Vanilla ES6, Web Audio API.

### 🎙️ Speaker Script:
> "For the user experience, we went with a vibrant arcade aesthetic inspired by Beach Buggy:
> - Everything is built with pure Vanilla JavaScript—no bulky React or Angular frameworks required.
> - The Snake game runs on an optimized HTML5 Canvas loop that dynamically ramps up speed as your score climbs.
> - For sound, instead of loading megabytes of MP3 files, we built a procedural synthesizer using the browser's native **Web Audio API**. It generates audio wave pulses on the fly for card flips, fruit bites, and victory jingles with virtually zero latency."

---

## 📽️ SLIDE 6: Production & Containerization
- **Key Points**:
  - Multi-stage Docker build separating compile time (Maven) from runtime (Eclipse Temurin JRE).
  - Environment-based configuration injection (`${PORT}`, `${DB_URL}`).
  - Pushed to GitHub and integrated with Render cloud deployment.

---

## 📽️ SLIDE 7: Live Demonstration
1. **User Registration & Login**: Show JWT token being saved in `localStorage`.
2. **Playing Snake / Memory Match**: Highlight sound effects, score tracker, and victory audio.
3. **Leaderboard Refresh**: Show automatic score submission and real-time leaderboard update.

---

## 💡 Anticipated Technical Questions & Answers (Q&A Prep)

### Q1: Why did you choose JWT over traditional HTTP Sessions?
> **Answer**: *"JWT is stateless. With traditional session IDs stored in server memory or Redis, scaling the application across multiple container instances requires sticky sessions or shared session state. JWTs are self-contained and cryptographically verified on each request, making the service cloud-ready and horizontally scalable."*

### Q2: How does the application handle database connections in different environments?
> **Answer**: *"We utilized Spring environment property placeholders: `${DB_URL:jdbc:h2:...}`. By default, it runs with a self-contained embedded H2 file database, allowing anyone to clone and launch it in 1 click. If deployed to production with a managed MySQL instance, passing the `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` environment variables automatically switches the application to MySQL without changing a single line of code."*

### Q3: How do you prevent circular dependency issues in Spring Security?
> **Answer**: *"In Spring Boot 3+, circular dependencies between `SecurityConfig` and `UserService` are strictly prevented. We resolved this by extracting the `PasswordEncoder` bean into an independent `@Configuration` class (`PasswordEncoderConfig`), allowing `UserService` to inject the encoder and `SecurityConfig` to inject `UserService` cleanly without cycle conflicts."*

### Q4: How is high score submission protected against tampering?
> **Answer**: *"Every score submission requires a signed JWT token in the `Authorization` header. The user ID is extracted directly from the validated token on the backend rather than trusted from the client payload. Further validations on non-negative values and upper bounds are enforced via Bean Validation (`@Valid`, `@Min(0)`)."*
