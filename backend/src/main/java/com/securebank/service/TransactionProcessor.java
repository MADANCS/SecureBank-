package com.securebank.service;

import com.securebank.dto.NotificationDto;
import com.securebank.entity.Account;
import com.securebank.entity.AuditLog;
import com.securebank.entity.Transaction;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.AuditLogRepository;
import com.securebank.repository.TransactionRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class TransactionProcessor {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationPublisherService notificationPublisherService;
    private final AuditLogRepository auditLogRepository;

    public TransactionProcessor(AccountRepository accountRepository,
                                TransactionRepository transactionRepository,
                                NotificationPublisherService notificationPublisherService,
                                AuditLogRepository auditLogRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.notificationPublisherService = notificationPublisherService;
        this.auditLogRepository = auditLogRepository;
    }

    @Async
    @Transactional
    public void processTransferAsync(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId).orElse(null);
        if (transaction == null || !transaction.getStatus().equals("PENDING")) {
            return;
        }

        try {
            transaction.setStatus("PROCESSING");
            transactionRepository.saveAndFlush(transaction);

            // Look up accounts — toAccount may be external (not in our DB)
            Optional<Account> toAccountOpt = accountRepository.findByAccountNumber(transaction.getToAccount());
            boolean isInternalTransfer = toAccountOpt.isPresent();


            if (isInternalTransfer) {
                // ── Internal transfer: lock both accounts in consistent order to prevent deadlocks ──
                String firstAcc  = transaction.getFromAccount().compareTo(transaction.getToAccount()) < 0
                    ? transaction.getFromAccount() : transaction.getToAccount();
                String secondAcc = transaction.getFromAccount().compareTo(transaction.getToAccount()) < 0
                    ? transaction.getToAccount() : transaction.getFromAccount();

                Account firstLock  = accountRepository.findByAccountNumberForUpdate(firstAcc)
                    .orElseThrow(() -> new IllegalArgumentException("Account not found: " + firstAcc));
                Account secondLock = accountRepository.findByAccountNumberForUpdate(secondAcc)
                    .orElseThrow(() -> new IllegalArgumentException("Account not found: " + secondAcc));

                Account from = transaction.getFromAccount().equals(firstLock.getAccountNumber()) ? firstLock : secondLock;
                Account to   = transaction.getToAccount().equals(firstLock.getAccountNumber())   ? firstLock : secondLock;

                if (from.getBalance().compareTo(transaction.getAmount()) < 0) {
                    failTransaction(transaction, "Insufficient funds");
                    return;
                }

                from.setBalance(from.getBalance().subtract(transaction.getAmount()));
                to.setBalance(to.getBalance().add(transaction.getAmount()));
                accountRepository.save(from);
                accountRepository.save(to);

                transaction.setStatus("COMPLETED");
                transactionRepository.save(transaction);
                publishSuccessNotifications(transaction, to.getOwner().getUsername());

            } else {
                // ── External transfer (e.g. Razorpay to outside account): only debit the fromAccount ──
                Account from = accountRepository.findByAccountNumberForUpdate(transaction.getFromAccount())
                    .orElseThrow(() -> new IllegalArgumentException("Source account not found: " + transaction.getFromAccount()));

                if (from.getBalance().compareTo(transaction.getAmount()) < 0) {
                    failTransaction(transaction, "Insufficient funds");
                    return;
                }

                from.setBalance(from.getBalance().subtract(transaction.getAmount()));
                accountRepository.save(from);

                transaction.setStatus("COMPLETED");
                transactionRepository.save(transaction);
                publishSuccessNotifications(transaction, from.getOwner().getUsername());
            }

        } catch (Exception e) {
            failTransaction(transaction, "System error during processing: " + e.getMessage());
        }
    }

    private void failTransaction(Transaction transaction, String reason) {
        transaction.setStatus("FAILED");
        transactionRepository.save(transaction);

        auditLogRepository.save(new AuditLog(
            transaction.getCreatedBy(), "TRANSFER_FAILED",
            "TxID=" + transaction.getId() + " Amount=" + transaction.getAmount() + " Reason: " + reason,
            "system", "TransactionProcessor", UUID.randomUUID().toString()
        ));

        notificationPublisherService.publish(new NotificationDto(
            UUID.randomUUID().toString(), transaction.getCreatedBy(),
            "TRANSACTION_FAILED", "Transfer Failed",
            "Your transfer of ₹" + transaction.getAmount() + " failed. Reason: " + reason,
            Instant.now().toString()
        ));
    }

    private void publishSuccessNotifications(Transaction transaction, String recipientUsername) {
        auditLogRepository.save(new AuditLog(
            transaction.getCreatedBy(), "TRANSFER_COMPLETED",
            "TxID=" + transaction.getId() + " Amount=" + transaction.getAmount()
            + " From=" + transaction.getFromAccount() + " To=" + transaction.getToAccount(),
            "system", "TransactionProcessor", UUID.randomUUID().toString()
        ));

        notificationPublisherService.publish(new NotificationDto(
            UUID.randomUUID().toString(), transaction.getCreatedBy(),
            "TRANSACTION", "Transfer Completed",
            "Your transfer of ₹" + transaction.getAmount() + " to " + transaction.getToAccount() + " completed successfully.",
            Instant.now().toString()
        ));

        if (!transaction.getCreatedBy().equals(recipientUsername)) {
            notificationPublisherService.publish(new NotificationDto(
                UUID.randomUUID().toString(), recipientUsername,
                "TRANSACTION", "Incoming Transfer",
                "You received ₹" + transaction.getAmount() + " from " + transaction.getFromAccount() + ".",
                Instant.now().toString()
            ));
        }
    }
}
