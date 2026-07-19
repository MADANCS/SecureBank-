package com.securebank.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.securebank.dto.NotificationDto;
import java.time.Duration;
import java.time.Instant;
import java.util.Random;
import java.util.UUID;

@Service
public class OtpService {
    private final RedisTemplate<String, Object> redisTemplate;
    private final NotificationPublisherService notificationPublisher;
    private static final Duration OTP_TTL = Duration.ofMinutes(5);

    public OtpService(RedisTemplate<String, Object> redisTemplate, NotificationPublisherService notificationPublisher) {
        this.redisTemplate = redisTemplate;
        this.notificationPublisher = notificationPublisher;
    }

    public String generateOtp(String username) {
        String otp = String.format("%06d", new Random().nextInt(1_000_000));
        redisTemplate.opsForValue().set(getRedisKey(username), otp, OTP_TTL);
        
        // Publish OTP via messaging queue (Simulates sending SMS / Email via Twilio/SES)
        NotificationDto otpNotification = new NotificationDto(
            UUID.randomUUID().toString(),
            username,
            "SECURITY",
            "Your Authentication Code",
            "Your SecureBank OTP is: " + otp + ". Do not share this with anyone. Valid for 5 minutes.",
            Instant.now().toString()
        );
        notificationPublisher.publish(otpNotification);

        return otp;
    }

    public void verifyOtp(String username, String otp) {
        String stored = (String) redisTemplate.opsForValue().get(getRedisKey(username));
        if (stored == null || !stored.equals(otp)) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }
        redisTemplate.delete(getRedisKey(username));
    }

    private String getRedisKey(String username) {
        return "otp:" + username;
    }
}
