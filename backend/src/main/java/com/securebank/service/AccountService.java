package com.securebank.service;

import com.securebank.entity.Account;
import com.securebank.entity.User;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.UserRepository;
import com.securebank.repository.TransactionV2Repository;
import com.securebank.entity.TransactionV2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class AccountService {
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionV2Repository transactionV2Repository;

    public AccountService(AccountRepository accountRepository, UserRepository userRepository, TransactionV2Repository transactionV2Repository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.transactionV2Repository = transactionV2Repository;
    }

    @Transactional(readOnly = true)
    public List<Account> getAccountsForUser(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return accountRepository.findAllByOwner(user).stream()
            .filter(Account::isActive)
            .toList();
    }

    @Transactional
    public Account createAccount(String username, String accountType) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Account account = new Account();
        account.setAccountType(accountType);
        account.setOwner(user);
        account.setAccountNumber(generateAccountNumber(accountType));
        account.setBalance(BigDecimal.ZERO);
        user.getAccounts().add(account);
        return accountRepository.save(account);
    }

    private String generateAccountNumber(String accountType) {
        String prefix = switch (accountType.toUpperCase()) {
            case "SAVINGS" -> "KAR-SAV";
            case "CURRENT" -> "KAR-CUR";
            case "FIXED" -> "KAR-FD";
            default -> "KAR-ACC";
        };
        return prefix + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
    }

    @Transactional(readOnly = true)
    public Account getAccountByNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
    }

    @Transactional
    public Account depositFunds(String accountNumber, BigDecimal amount, String username) {
        Account account = getAccountByNumber(accountNumber);
        if (!account.getOwner().getUsername().equals(username)) {
            throw new IllegalArgumentException("Not authorized to deposit to this account");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        account.setBalance(account.getBalance().add(amount));

        TransactionV2 tx = new TransactionV2(
                "SYSTEM", account.getAccountNumber(), amount,
                TransactionV2.TransactionCategory.OTHER,
                UUID.randomUUID().toString(), username);
        tx.setDescription("Self Deposit");
        tx.setStatus(TransactionV2.TransactionStatus.COMPLETED);
        tx.setReferenceNumber(UUID.randomUUID().toString());
        transactionV2Repository.save(tx);

        return accountRepository.save(account);
    }

    @Transactional
    public Account adminDepositFunds(String accountNumber, BigDecimal amount, String adminUsername) {
        Account account = getAccountByNumber(accountNumber);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        account.setBalance(account.getBalance().add(amount));

        TransactionV2 tx = new TransactionV2(
                "SYSTEM", account.getAccountNumber(), amount,
                TransactionV2.TransactionCategory.OTHER,
                UUID.randomUUID().toString(), adminUsername);
        tx.setDescription("Admin Deposit");
        tx.setStatus(TransactionV2.TransactionStatus.COMPLETED);
        tx.setReferenceNumber(UUID.randomUUID().toString());
        transactionV2Repository.save(tx);

        return accountRepository.save(account);
    }

    /**
     * Admin-only: Create a new account and optionally fund it — all in one atomic transaction.
     * Returns a summary map with account details + transaction info.
     */
    @Transactional
    public java.util.Map<String, Object> adminProvisionAccount(
            String username, String accountType, BigDecimal initialDeposit, String adminUsername) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User '" + username + "' not found"));

        // Create the account
        Account account = new Account();
        account.setAccountType(accountType);
        account.setOwner(user);
        account.setAccountNumber(generateAccountNumber(accountType));
        account.setBalance(BigDecimal.ZERO);
        account.setActive(true);
        user.getAccounts().add(account);
        account = accountRepository.save(account);

        String txRef = null;

        // Fund if initial deposit > 0
        if (initialDeposit != null && initialDeposit.compareTo(BigDecimal.ZERO) > 0) {
            account.setBalance(initialDeposit);
            String idempotencyKey = UUID.randomUUID().toString();
            txRef = UUID.randomUUID().toString();
            TransactionV2 tx = new TransactionV2(
                    "SYSTEM", account.getAccountNumber(), initialDeposit,
                    TransactionV2.TransactionCategory.OTHER,
                    idempotencyKey, adminUsername);
            tx.setDescription("Admin Provision - Initial Deposit");
            tx.setStatus(TransactionV2.TransactionStatus.COMPLETED);
            tx.setReferenceNumber(txRef);
            transactionV2Repository.save(tx);
            account = accountRepository.save(account);
        }

        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("accountNumber", account.getAccountNumber());
        result.put("accountType", account.getAccountType());
        result.put("username", user.getUsername());
        result.put("email", user.getEmail());
        result.put("balance", account.getBalance());
        result.put("active", account.isActive());
        result.put("initialDeposit", initialDeposit != null ? initialDeposit : BigDecimal.ZERO);
        result.put("transactionRef", txRef);
        result.put("provisionedBy", adminUsername);
        result.put("provisionedAt", java.time.Instant.now().toString());
        return result;
    }
}
