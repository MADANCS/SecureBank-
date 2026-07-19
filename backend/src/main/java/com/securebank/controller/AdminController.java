package com.securebank.controller;

import com.securebank.entity.Account;
import com.securebank.entity.KycStatus;
import com.securebank.entity.User;
import com.securebank.entity.Transaction;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.TransactionRepository;
import com.securebank.repository.UserRepository;
import com.securebank.service.AccountFreezeService;
import com.securebank.service.TransactionProcessor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionProcessor transactionProcessor;
    private final AccountFreezeService accountFreezeService;

    public AdminController(UserRepository userRepository, 
                           AccountRepository accountRepository,
                           TransactionRepository transactionRepository,
                           TransactionProcessor transactionProcessor,
                           AccountFreezeService accountFreezeService) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.transactionProcessor = transactionProcessor;
        this.accountFreezeService = accountFreezeService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> listUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
            .map(u -> Map.<String, Object>of(
                "id",        String.valueOf(u.getId()),
                "username",  u.getUsername(),
                "email",     u.getEmail(),
                "role",      u.getRole(),
                "kycStatus", u.getKycStatus().name(),
                "active",    u.isActive(),
                "accounts",  u.getAccounts().stream().filter(Account::isActive).map(Account::getAccountNumber).collect(Collectors.toList())
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users/{id}/kyc")
    public ResponseEntity<Map<String, Object>> updateKycStatus(
            @PathVariable("id") Long id,
            @RequestParam(name = "status", defaultValue = "VERIFIED") KycStatus status) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setKycStatus(status);
        User saved = userRepository.save(user);
        return ResponseEntity.ok(Map.of(
            "id", String.valueOf(saved.getId()),
            "username", saved.getUsername(),
            "kycStatus", saved.getKycStatus().name()
        ));
    }

    /** Frontend Admin.tsx calls POST /admin/users/{id}/kyc/approve */
    @PostMapping("/users/{id}/kyc/approve")
    public ResponseEntity<Map<String, Object>> approveKyc(@PathVariable("id") Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setKycStatus(KycStatus.VERIFIED);
        User saved = userRepository.save(user);
        return ResponseEntity.ok(Map.of(
            "id",        String.valueOf(saved.getId()),
            "username",  saved.getUsername(),
            "kycStatus", saved.getKycStatus().name(),
            "message",   "KYC approved successfully"
        ));
    }

    /** Frontend Admin.tsx calls POST /admin/users/{id}/kyc/reject */
    @PostMapping("/users/{id}/kyc/reject")
    public ResponseEntity<Map<String, Object>> rejectKyc(@PathVariable("id") Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setKycStatus(KycStatus.REJECTED);
        User saved = userRepository.save(user);
        return ResponseEntity.ok(Map.of(
            "id",        String.valueOf(saved.getId()),
            "username",  saved.getUsername(),
            "kycStatus", saved.getKycStatus().name(),
            "message",   "KYC rejected"
        ));
    }

    @PostMapping("/accounts/{accountNumber}/freeze")
    public ResponseEntity<Account> freezeAccount(@PathVariable("accountNumber") String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        account.setActive(false);
        return ResponseEntity.ok(accountRepository.save(account));
    }

    @PostMapping("/accounts/{accountNumber}/unfreeze")
    public ResponseEntity<Account> unfreezeAccount(@PathVariable("accountNumber") String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        account.setActive(true);
        return ResponseEntity.ok(accountRepository.save(account));
    }

    // ── Fraud Management Endpoints ──

    @GetMapping("/fraud/transactions")
    public ResponseEntity<List<Transaction>> listFraudulentTransactions() {
        // Return all transactions flagged as BLOCKED_FRAUD
        List<Transaction> fraudTxs = transactionRepository.findAll().stream()
            .filter(tx -> "BLOCKED_FRAUD".equals(tx.getStatus()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(fraudTxs);
    }

    @PostMapping("/fraud/transactions/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveFraudTransaction(@PathVariable("id") Long id) {
        Transaction tx = transactionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
            
        if (!"BLOCKED_FRAUD".equals(tx.getStatus())) {
            throw new IllegalStateException("Transaction is not in BLOCKED_FRAUD state");
        }

        // Unfreeze the sender's account
        accountFreezeService.unfreezeAccount(tx.getFromAccount(), "ADMIN");

        // Reset status and re-process
        tx.setStatus("PENDING");
        transactionRepository.save(tx);
        transactionProcessor.processTransferAsync(tx.getId());

        return ResponseEntity.ok(Map.of(
            "message", "Fraud transaction approved, account unfrozen, and transfer processing resumed.",
            "transactionId", tx.getId()
        ));
    }

    @PostMapping("/fraud/transactions/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectFraudTransaction(@PathVariable("id") Long id) {
        Transaction tx = transactionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
            
        if (!"BLOCKED_FRAUD".equals(tx.getStatus())) {
            throw new IllegalStateException("Transaction is not in BLOCKED_FRAUD state");
        }

        // Mark as failed permanently. Account remains frozen for investigation.
        tx.setStatus("FAILED");
        transactionRepository.save(tx);

        return ResponseEntity.ok(Map.of(
            "message", "Fraud transaction rejected. Account remains frozen.",
            "transactionId", tx.getId()
        ));
    }
}
