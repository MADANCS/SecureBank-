package com.securebank.controller;

import com.securebank.service.TwoFactorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/2fa")
public class TwoFactorController {

    private final TwoFactorService twoFactorService;

    public TwoFactorController(TwoFactorService twoFactorService) {
        this.twoFactorService = twoFactorService;
    }

    /** Send OTP to the authenticated user's registered email/phone */
    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(
            Authentication auth,
            @RequestParam(defaultValue = "LOGIN") String purpose) {

        String username = auth.getName();
        String otp = twoFactorService.generateOtp(username, purpose);

        // In dev we return the OTP directly; in prod remove it from the response
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP sent. Check your registered email/SMS.",
                "otp", otp   // dev only — remove in production
        ));
    }

    /** Verify OTP submitted by user */
    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(
            Authentication auth,
            @RequestBody Map<String, String> body) {

        String username = auth.getName();
        String otp = body.get("otp");
        String purpose = body.getOrDefault("purpose", "LOGIN");

        boolean valid = twoFactorService.verifyOtp(username, otp, purpose);
        if (!valid) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid or expired OTP"
            ));
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP verified successfully"
        ));
    }
}
