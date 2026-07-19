package com.securebank.service;

import com.securebank.dto.NotificationDto;
import com.securebank.dto.RecurringPaymentRequest;
import com.securebank.entity.Account;
import com.securebank.entity.RecurringPayment;
import com.securebank.entity.Transaction;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.RecurringPaymentRepository;
import com.securebank.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RecurringPaymentService {
    private final RecurringPaymentRepository recurringPaymentRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationPublisherService notificationPublisherService;

    public RecurringPaymentService(RecurringPaymentRepository recurringPaymentRepository,
                                   AccountRepository accountRepository,
                                   TransactionRepository transactionRepository,
                                   NotificationPublisherService notificationPublisherService) {
        this.recurringPaymentRepository = recurringPaymentRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.notificationPublisherService = notificationPublisherService;
    }

    @Transactional
    public RecurringPayment createRecurringPayment(RecurringPaymentRequest request) {
        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        RecurringPayment recurringPayment = new RecurringPayment();
        recurringPayment.setAccountNumber(account.getAccountNumber());
        recurringPayment.setBillType(request.getBillType());
        recurringPayment.setReference(request.getReference());
        recurringPayment.setAmount(request.getAmount());
        recurringPayment.setFrequency(request.getFrequency().toUpperCase());
        recurringPayment.setStatus("ACTIVE");
        recurringPayment.setEnabled(true);

        if (request.getStartDate() != null && !request.getStartDate().isBlank()) {
            recurringPayment.setNextExecutionAt(LocalDate.parse(request.getStartDate()).atStartOfDay().toInstant(ZoneOffset.UTC));
        } else {
            recurringPayment.setNextExecutionAt(Instant.now().plus(1, ChronoUnit.DAYS));
        }

        return recurringPaymentRepository.save(recurringPayment);
    }

    @Transactional(readOnly = true)
    public List<RecurringPayment> listRecurringPayments(String accountNumber) {
        return recurringPaymentRepository.findAllByAccountNumber(accountNumber);
    }

    @Transactional
    public void cancelRecurringPayment(String id) {
        Long paymentId;
        try {
            paymentId = Long.parseLong(id);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid recurring payment ID: " + id);
        }
        RecurringPayment payment = recurringPaymentRepository.findById(paymentId)
            .orElseThrow(() -> new IllegalArgumentException("Recurring payment not found: " + id));
        payment.setEnabled(false);
        payment.setStatus("CANCELLED");
        recurringPaymentRepository.save(payment);
    }

    @Transactional
    public void executeDueRecurringPayments() {
        Instant now = Instant.now();
        List<RecurringPayment> duePayments = recurringPaymentRepository.findAllByEnabledTrueAndNextExecutionAtBefore(now);
        for (RecurringPayment recurringPayment : duePayments) {
            Optional<Account> optionalAccount = accountRepository.findByAccountNumber(recurringPayment.getAccountNumber());
            recurringPayment.setLastExecutedAt(now);

            if (optionalAccount.isEmpty()) {
                recurringPayment.setStatus("FAILED");
                recurringPayment.setLastExecutionStatus("ACCOUNT_NOT_FOUND");
                recurringPayment.setNextExecutionAt(calculateNextExecution(recurringPayment.getNextExecutionAt(), recurringPayment.getFrequency()));
                recurringPaymentRepository.save(recurringPayment);
                continue;
            }

            Account account = optionalAccount.get();
            BigDecimal amount = recurringPayment.getAmount();
            if (account.getBalance().compareTo(amount) < 0) {
                recurringPayment.setLastExecutionStatus("INSUFFICIENT_FUNDS");
                recurringPayment.setNextExecutionAt(calculateNextExecution(recurringPayment.getNextExecutionAt(), recurringPayment.getFrequency()));
                recurringPaymentRepository.save(recurringPayment);

                notificationPublisherService.publish(new NotificationDto(
                    UUID.randomUUID().toString(),
                    account.getOwner().getUsername(),
                    "RECURRING_PAYMENT",
                    "Recurring Payment Failed",
                    "Your recurring payment of ₹" + amount + " could not be processed due to insufficient funds.",
                    Instant.now().toString()
                ));
                continue;
            }

            account.setBalance(account.getBalance().subtract(amount));
            accountRepository.save(account);

            Transaction transaction = new Transaction();
            transaction.setFromAccount(account.getAccountNumber());
            transaction.setToAccount(recurringPayment.getReference());
            transaction.setAmount(amount);
            transaction.setStatus("COMPLETED");
            transaction.setIdempotencyKey(UUID.randomUUID().toString());
            transaction.setCreatedBy("scheduler");
            transactionRepository.save(transaction);

            recurringPayment.setLastExecutionStatus("COMPLETED");
            recurringPayment.setNextExecutionAt(calculateNextExecution(recurringPayment.getNextExecutionAt(), recurringPayment.getFrequency()));
            recurringPaymentRepository.save(recurringPayment);

            notificationPublisherService.publish(new NotificationDto(
                UUID.randomUUID().toString(),
                account.getOwner().getUsername(),
                "RECURRING_PAYMENT",
                "Recurring Payment Completed",
                "Your recurring payment of ₹" + amount + " has been processed successfully.",
                Instant.now().toString()
            ));
        }
    }

    private Instant calculateNextExecution(Instant current, String frequency) {
        return switch (frequency.toUpperCase()) {
            case "DAILY" -> current.plus(1, ChronoUnit.DAYS);
            case "WEEKLY" -> current.plus(1, ChronoUnit.WEEKS);
            case "MONTHLY" -> current.plus(1, ChronoUnit.MONTHS);
            default -> current.plus(1, ChronoUnit.MONTHS);
        };
    }
}
