package com.gameplatform.controller;

import com.gameplatform.config.JwtUtil;
import com.gameplatform.dto.AuthRequest;
import com.gameplatform.dto.AuthResponse;
import com.gameplatform.entity.User;
import com.gameplatform.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authManager, UserService userService, JwtUtil jwtUtil) {
        this.authManager = authManager;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> req) {
        try {
            User user = userService.registerUser(req.get("username"), req.get("email"), req.get("password"));
            UserDetails ud = userService.loadUserByUsername(user.getUsername());
            String token = jwtUtil.generateToken(ud);
            return ResponseEntity.ok(new AuthResponse(token, user.getUsername(), "Registration successful"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest req) {
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
            UserDetails ud = userService.loadUserByUsername(req.getUsername());
            String token = jwtUtil.generateToken(ud);
            return ResponseEntity.ok(new AuthResponse(token, req.getUsername(), "Login successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid credentials"));
        }
    }
}
