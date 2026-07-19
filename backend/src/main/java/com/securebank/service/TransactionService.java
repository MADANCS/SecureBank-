package com.securebank.service;

import com.securebank.dto.TransferRequest;
import com.securebank.dto.NotificationDto;
import com.securebank.entity.Account;
import com.securebank.entity.AuditLog;
import com.securebank.entity.Transaction;
import com.securebank.entity.TransactionV2;
import com.securebank.exception.InsufficientFundsException;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.AuditLogRepository;
import com.securebank.repository.TransactionRepository;
import com.securebank.repository.TransactionV2Repository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.UUID;

@Service
public class TransactionService {
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionV2Repository transactionV2Repository;
    private final OtpService otpService;
    private final NotificationPublisherService notificationPublisherService;
    private final TransactionProcessor transactionProcessor;
    private final SpendingLimitService spendingLimitService;
    private final FraudDetectionService fraudDetectionService;
    private final AccountFreezeService accountFreezeService;
    private final AuditLogRepository auditLogRepository;
    private final TransactionPinService transactionPinService;

    public TransactionService(AccountRepository accountRepository,
                              TransactionRepository transactionRepository,
                              TransactionV2Repository transactionV2Repository,
                              OtpService otpService,
                              NotificationPublisherService notificationPublisherService,
                              TransactionProcessor transactionProcessor,
                              SpendingLimitService spendingLimitService,
                              FraudDetectionService fraudDetectionService,
                              AccountFreezeService accountFreezeService,
                              AuditLogRepository auditLogRepository,
                              TransactionPinService transactionPinService) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.transactionV2Repository = transactionV2Repository;
        this.otpService = otpService;
        this.notificationPublisherService = notificationPublisherService;
        this.transactionProcessor = transactionProcessor;
        this.spendingLimitService = spendingLimitService;
        this.fraudDetectionService = fraudDetectionService;
        this.accountFreezeService = accountFreezeService;
        this.auditLogRepository = auditLogRepository;
        this.transactionPinService = transactionPinService;
    }

    @Transactional
    public Transaction transfer(TransferRequest request, String initiatedBy) {
        Optional<Transaction> duplicate = transactionRepository.findByIdempotencyKey(request.getIdempotencyKey());
        if (duplicate.isPresent()) {
            return duplicate.get();
        }

        Account from = accountRepository.findByAccountNumber(request.getFromAccount())
            .orElseThrow(() -> new IllegalArgumentException("Source account not found"));

        // ── FRAUD PRE-CHECK ──────────────────────────────────────────────────────
        Transaction candidate = new Transaction();
        candidate.setFromAccount(request.getFromAccount());
        candidate.setToAccount(request.getToAccount());
        candidate.setAmount(request.getAmount());
        candidate.setCreatedBy(initiatedBy);
        candidate.setIdempotencyKey(request.getIdempotencyKey());

        Optional<String> fraudReason = fraudDetectionService.analyzeTransaction(candidate);
        if (fraudReason.isPresent()) {
            candidate.setStatus("BLOCKED_FRAUD");
            Transaction blocked = transactionRepository.save(candidate);

            accountFreezeService.freezeAccount(from.getAccountNumber(), "SYSTEM_FRAUD_ENGINE", fraudReason.get());

            notificationPublisherService.publish(new NotificationDto(
                UUID.randomUUID().toString(), initiatedBy,
                "FRAUD_ALERT", "🚨 Transaction Blocked",
                "Your transfer of ₹" + request.getAmount() + " was blocked by our Fraud Detection Engine. Your account is temporarily frozen.",
                Instant.now().toString()
            ));

            auditLogRepository.save(new AuditLog(
                initiatedBy, "FRAUD_INTERCEPT",
                "TxID=" + blocked.getId() + " Amount=" + request.getAmount() + " Reason: " + fraudReason.get(),
                "system", "FraudDetectionService", UUID.randomUUID().toString()
            ));

            return blocked;
        }

        // ── SPENDING LIMITS ──────────────────────────────────────────────────────
        spendingLimitService.enforceSpendingLimits(from.getOwner().getUsername(), request.getAmount());

        // ── TRANSACTION PIN + OTP GATE ───────────────────────────────────────────
        // Razorpay payments (keyed "rzp_...") are HMAC-verified externally — skip internal gates.
        boolean isRazorpayTransfer = request.getIdempotencyKey() != null
                && request.getIdempotencyKey().startsWith("rzp_");

        if (!isRazorpayTransfer) {
            // Step 1: Verify Transaction PIN (always required for direct transfers)
            if (request.getTransactionPin() == null || request.getTransactionPin().isBlank()) {
                throw new IllegalArgumentException("Transaction PIN is required for direct transfers");
            }
            boolean pinOk = transactionPinService.verifyPin(from.getOwner().getUsername(), request.getTransactionPin());
            if (!pinOk) {
                throw new IllegalArgumentException("Invalid Transaction PIN");
            }

            // Step 2: OTP required for high-value transfers (≥ ₹10,000)
            if (request.getAmount().compareTo(new BigDecimal("10000")) >= 0) {
                otpService.verifyOtp(from.getOwner().getUsername(), request.getOtp());
            }
        }

        // ── CREATE & QUEUE TRANSACTION ───────────────────────────────────────────
        Transaction transaction = new Transaction();
        transaction.setFromAccount(request.getFromAccount());
        transaction.setToAccount(request.getToAccount());
        transaction.setAmount(request.getAmount());
        transaction.setStatus("PENDING");
        transaction.setIdempotencyKey(request.getIdempotencyKey());
        transaction.setCreatedBy(initiatedBy);

        Transaction saved = transactionRepository.save(transaction);
        transactionProcessor.processTransferAsync(saved.getId());
        return saved;
    }

    public Page<Transaction> listTransactions(String accountNumber,
                                              String status,
                                              String fromDate,
                                              String toDate,
                                              Pageable pageable) {
        Specification<Transaction> spec = Specification.where(accountInvolved(accountNumber));
        if (status != null && !status.isBlank()) {
            spec = spec.and(statusEquals(status));
        }
        if (fromDate != null && !fromDate.isBlank()) {
            spec = spec.and(dateAfterOrEqual(fromDate));
        }
        if (toDate != null && !toDate.isBlank()) {
            spec = spec.and(dateBeforeOrEqual(toDate));
        }
        return transactionRepository.findAll(spec, pageable);
    }

    private Specification<Transaction> accountInvolved(String accountNumber) {
        return (root, query, builder) -> builder.or(
            builder.equal(root.get("fromAccount"), accountNumber),
            builder.equal(root.get("toAccount"), accountNumber)
        );
    }

    private Specification<Transaction> statusEquals(String status) {
        return (root, query, builder) -> builder.equal(root.get("status"), status.toUpperCase());
    }

    private Specification<Transaction> dateAfterOrEqual(String fromDate) {
        Instant instant = LocalDate.parse(fromDate).atStartOfDay().toInstant(ZoneOffset.UTC);
        return (root, query, builder) -> builder.greaterThanOrEqualTo(root.get("createdAt"), instant);
    }

    private Specification<Transaction> dateBeforeOrEqual(String toDate) {
        Instant instant = LocalDate.parse(toDate).atTime(23, 59, 59).toInstant(ZoneOffset.UTC);
        return (root, query, builder) -> builder.lessThanOrEqualTo(root.get("createdAt"), instant);
    }

    public String createTransactionV2(String fromAccount, String toAccount, 
                                      BigDecimal amount,
                                      TransactionV2.TransactionCategory category,
                                      String idempotencyKey, String createdBy, String description) {
        TransactionV2 transaction = new TransactionV2(fromAccount, toAccount, amount, category, idempotencyKey, createdBy);
        transaction.setDescription(description);
        transaction.setStatus(TransactionV2.TransactionStatus.PENDING);
        transaction.setReferenceNumber(UUID.randomUUID().toString());
        
        transactionV2Repository.save(transaction);
        return transaction.getReferenceNumber();
    }

    public Map<String, Object> getSpendingByCategory(String username) {
        Map<String, Object> breakdown = new HashMap<>();
        Map<String, BigDecimal> categories = new HashMap<>();
        for (TransactionV2.TransactionCategory cat : TransactionV2.TransactionCategory.values()) {
            categories.put(cat.name(), BigDecimal.ZERO);
        }
        breakdown.put("categories", categories);
        return breakdown;
    }
}
