package com.securebank.service;

import com.securebank.entity.TwoFactorToken;
import com.securebank.repository.TwoFactorTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.logging.Logger;

@Service
public class TwoFactorService {

    private static final Logger log = Logger.getLogger(TwoFactorService.class.getName());
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;
    private final TwoFactorTokenRepository tokenRepository;

    public TwoFactorService(TwoFactorTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    /**
     * Generate and "send" a 6-digit OTP for the given username and purpose.
     * In production this would send via email/SMS. In dev it is logged.
     */
    @Transactional
    public String generateOtp(String username, String purpose) {
        // Remove any existing unused OTP for the same purpose
        tokenRepository.deleteByUsernameAndPurpose(username, purpose);

        String otp = generateNumericOtp();

        TwoFactorToken token = new TwoFactorToken();
        token.setUsername(username);
        token.setToken(otp);
        token.setPurpose(purpose);
        token.setExpiresAt(Instant.now().plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES));
        token.setUsed(false);
        tokenRepository.save(token);

        // In production: send via email or SMS
        log.info("[2FA OTP] User=" + username + " Purpose=" + purpose + " OTP=" + otp + " (expires in " + OTP_EXPIRY_MINUTES + " min)");

        return otp; // returned for dev/testing; in prod, return only a masked acknowledgement
    }

    /**
     * Verify an OTP.
     * @return true if valid and not expired; marks as used on success
     */
    @Transactional
    public boolean verifyOtp(String username, String otp, String purpose) {
        Optional<TwoFactorToken> tokenOpt = tokenRepository
                .findByTokenAndUsernameAndPurpose(otp, username, purpose);

        if (tokenOpt.isEmpty()) {
            return false;
        }
        TwoFactorToken token = tokenOpt.get();
        if (token.isUsed() || token.getExpiresAt().isBefore(Instant.now())) {
            return false;
        }
        token.setUsed(true);
        tokenRepository.save(token);
        return true;
    }

    @Transactional
    public void cleanupExpired() {
        tokenRepository.deleteExpiredTokens(Instant.now());
    }

    private String generateNumericOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100_000 + random.nextInt(900_000);
        return String.valueOf(otp);
    }
}
