package com.securebank.controller;

import com.securebank.entity.NotificationPreference;
import com.securebank.service.NotificationPreferenceService;
import com.securebank.service.TransactionPinService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final NotificationPreferenceService preferenceService;
    private final TransactionPinService transactionPinService;

    public ProfileController(NotificationPreferenceService preferenceService,
                             TransactionPinService transactionPinService) {
        this.preferenceService = preferenceService;
        this.transactionPinService = transactionPinService;
    }

    /** Get notification preferences */
    @GetMapping("/notification-preferences")
    public ResponseEntity<NotificationPreference> getPreferences(Authentication auth) {
        return ResponseEntity.ok(preferenceService.getOrCreate(auth.getName()));
    }

    /** Update notification preferences */
    @PutMapping("/notification-preferences")
    public ResponseEntity<Map<String, Object>> updatePreferences(
            Authentication auth, @RequestBody Map<String, Object> body) {
        NotificationPreference pref = preferenceService.update(
                auth.getName(),
                Boolean.parseBoolean(body.getOrDefault("emailOnLogin", "true").toString()),
                Boolean.parseBoolean(body.getOrDefault("smsOnLogin", "false").toString()),
                Boolean.parseBoolean(body.getOrDefault("emailOnLargeTransaction", "true").toString()),
                Boolean.parseBoolean(body.getOrDefault("smsOnLargeTransaction", "true").toString()),
                body.containsKey("largeTransactionThreshold")
                        ? new BigDecimal(body.get("largeTransactionThreshold").toString()) : null,
                Boolean.parseBoolean(body.getOrDefault("lowBalanceAlert", "true").toString()),
                body.containsKey("lowBalanceThreshold")
                        ? new BigDecimal(body.get("lowBalanceThreshold").toString()) : null,
                Boolean.parseBoolean(body.getOrDefault("inAppNotifications", "true").toString()),
                Boolean.parseBoolean(body.getOrDefault("emailOnAccountFreeze", "true").toString())
        );
        return ResponseEntity.ok(Map.of("success", true, "message", "Preferences updated", "preferences", pref));
    }

    /** Check if transaction PIN is set */
    @GetMapping("/transaction-pin/status")
    public ResponseEntity<Map<String, Object>> pinStatus(Authentication auth) {
        boolean hasPin = transactionPinService.hasPinSet(auth.getName());
        return ResponseEntity.ok(Map.of("hasPinSet", hasPin));
    }

    /** Set or update transaction PIN */
    @PostMapping("/transaction-pin/set")
    public ResponseEntity<Map<String, Object>> setPin(
            Authentication auth, @RequestBody Map<String, String> body) {
        try {
            transactionPinService.setPin(auth.getName(), body.get("currentPassword"), body.get("newPin"));
            return ResponseEntity.ok(Map.of("success", true, "message", "Transaction PIN set successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Verify transaction PIN (used before transfer confirmation) */
    @PostMapping("/transaction-pin/verify")
    public ResponseEntity<Map<String, Object>> verifyPin(
            Authentication auth, @RequestBody Map<String, String> body) {
        boolean valid = transactionPinService.verifyPin(auth.getName(), body.get("pin"));
        if (!valid) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Incorrect transaction PIN"));
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "PIN verified"));
    }
}
