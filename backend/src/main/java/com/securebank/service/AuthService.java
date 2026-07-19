package com.securebank.service;

import com.securebank.config.JwtConfig;
import com.securebank.dto.AuthResponse;
import com.securebank.dto.AuthRequest;
import com.securebank.dto.RegisterRequest;
import com.securebank.entity.KycStatus;
import com.securebank.entity.RefreshToken;
import com.securebank.entity.User;
import com.securebank.repository.RefreshTokenRepository;
import com.securebank.repository.UserRepository;
import com.securebank.security.JwtUtil;
import com.securebank.security.RateLimitService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JwtConfig jwtConfig;
    private final AccountService accountService;
    private final RateLimitService rateLimitService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       JwtConfig jwtConfig,
                       AccountService accountService,
                       RateLimitService rateLimitService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.jwtConfig = jwtConfig;
        this.accountService = accountService;
        this.rateLimitService = rateLimitService;
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        if (rateLimitService.isAccountLocked(request.getUsername())) {
            long remainingMinutes = rateLimitService.getRemainingLockoutTime(request.getUsername());
            throw new IllegalArgumentException("Account locked due to multiple failed attempts. Try again in " + remainingMinutes + " seconds.");
        }

        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            rateLimitService.recordLoginAttempt(request.getUsername());
            throw new IllegalArgumentException("Invalid credentials");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", new String[]{"ROLE_" + user.getRole()});

        String accessToken = jwtUtil.generateAccessToken(user.getUsername(), claims);
        String refreshTokenValue = jwtUtil.generateRefreshToken(user.getUsername(), claims);

        RefreshToken refreshToken = new RefreshToken();
        rateLimitService.resetLoginAttempts(user.getUsername());
        refreshToken.setToken(refreshTokenValue);
        refreshToken.setUsername(user.getUsername());
        refreshToken.setExpiresAt(Instant.now().plusMillis(jwtConfig.getRefreshTokenExpiresIn()));
        refreshTokenRepository.deleteByUsername(user.getUsername());
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(accessToken, refreshTokenValue, user.getUsername(), "ROLE_" + user.getRole());
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
            .orElseThrow(() -> new IllegalArgumentException("Refresh token invalid"));
        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Refresh token expired");
        }
        var claims = jwtUtil.parseClaims(refreshTokenValue);
        String username = claims.getSubject();
        Map<String, Object> newClaims = new HashMap<>();
        newClaims.put("roles", claims.get("roles"));

        String accessToken = jwtUtil.generateAccessToken(username, newClaims);
        String newRefreshTokenValue = jwtUtil.generateRefreshToken(username, newClaims);

        refreshToken.setToken(newRefreshTokenValue);
        refreshToken.setExpiresAt(Instant.now().plusMillis(jwtConfig.getRefreshTokenExpiresIn()));
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(accessToken, newRefreshTokenValue, username);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setRole("USER");
        user.setKycStatus(KycStatus.PENDING);
        user.setActive(true);
        user.setCreatedBy("self-signup");

        userRepository.save(user);
        accountService.createAccount(user.getUsername(), "SAVINGS");

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", new String[]{"ROLE_USER"});

        String accessToken = jwtUtil.generateAccessToken(user.getUsername(), claims);
        String refreshTokenValue = jwtUtil.generateRefreshToken(user.getUsername(), claims);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(refreshTokenValue);
        refreshToken.setUsername(user.getUsername());
        refreshToken.setExpiresAt(Instant.now().plusMillis(jwtConfig.getRefreshTokenExpiresIn()));
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(accessToken, refreshTokenValue, user.getUsername(), "ROLE_USER");
    }
}
