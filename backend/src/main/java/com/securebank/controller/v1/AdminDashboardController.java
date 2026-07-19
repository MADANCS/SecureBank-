package com.securebank.controller.v1;

import com.securebank.repository.AccountRepository;
import com.securebank.repository.AuditLogRepository;
import com.securebank.repository.TransactionRepository;
import com.securebank.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final AuditLogRepository auditLogRepository;

    public AdminDashboardController(UserRepository userRepository,
                                    AccountRepository accountRepository,
                                    TransactionRepository transactionRepository,
                                    AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Instant since24h = Instant.now().minus(24, ChronoUnit.HOURS);

        return ResponseEntity.ok(Map.of(
            "totalUsers",        userRepository.count(),
            "totalAccounts",     accountRepository.count(),
            "totalTransactions", transactionRepository.count(),
            "recentTxCount",     transactionRepository.countByCreatedAtAfter(since24h),
            "failedTxCount",     transactionRepository.countByStatus("FAILED"),
            "completedTxCount",  transactionRepository.countByStatus("COMPLETED"),
            "auditEvents",       auditLogRepository.count(),
            "recentAuditEvents", auditLogRepository.countByTimestampAfter(since24h)
        ));
    }
}
