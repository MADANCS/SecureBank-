package com.securebank.repository;

import com.securebank.entity.TwoFactorToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Optional;

public interface TwoFactorTokenRepository extends JpaRepository<TwoFactorToken, Long> {
    Optional<TwoFactorToken> findByTokenAndUsernameAndPurpose(String token, String username, String purpose);
    Optional<TwoFactorToken> findByUsernameAndPurposeAndUsedFalse(String username, String purpose);

    @Modifying
    @Transactional
    @Query("DELETE FROM TwoFactorToken t WHERE t.username = :username AND t.purpose = :purpose")
    void deleteByUsernameAndPurpose(String username, String purpose);

    @Modifying
    @Transactional
    @Query("DELETE FROM TwoFactorToken t WHERE t.expiresAt < :now")
    void deleteExpiredTokens(Instant now);
}
