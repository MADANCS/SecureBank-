package com.securebank.security;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RateLimitService {
    private final RedisTemplate<String, Object> redisTemplate;
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);

    public RateLimitService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void recordLoginAttempt(String username) {
        String key = "login:attempts:" + username;
        try {
            Long attempts = (Long) redisTemplate.opsForValue().increment(key);
            if (attempts == 1) {
                redisTemplate.expire(key, LOCKOUT_DURATION);
            }
        } catch (Exception ex) {
            // If Redis is unavailable, allow attempt to proceed
        }
    }

    public void resetLoginAttempts(String username) {
        String key = "login:attempts:" + username;
        try {
            redisTemplate.delete(key);
        } catch (Exception ex) {
            // Redis unavailable
        }
    }

    public boolean isAccountLocked(String username) {
        String key = "login:attempts:" + username;
        try {
            Object attempts = redisTemplate.opsForValue().get(key);
            return attempts != null && (Long) attempts >= MAX_LOGIN_ATTEMPTS;
        } catch (Exception ex) {
            return false;
        }
    }

    public long getRemainingLockoutTime(String username) {
        String key = "login:attempts:" + username;
        try {
            Long ttl = redisTemplate.getExpire(key);
            return ttl != null && ttl > 0 ? ttl : 0;
        } catch (Exception ex) {
            return 0;
        }
    }
}
