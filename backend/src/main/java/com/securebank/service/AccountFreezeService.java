package com.securebank.service;

import com.securebank.entity.Account;
import com.securebank.entity.AccountFreezeHistory;
import com.securebank.repository.AccountFreezeHistoryRepository;
import com.securebank.repository.AccountRepository;
import com.securebank.dto.NotificationDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AccountFreezeService {
    private final AccountRepository accountRepository;
    private final AccountFreezeHistoryRepository freezeHistoryRepository;
    private final NotificationPublisherService notificationPublisherService;

    public AccountFreezeService(AccountRepository accountRepository,
                                AccountFreezeHistoryRepository freezeHistoryRepository,
                                NotificationPublisherService notificationPublisherService) {
        this.accountRepository = accountRepository;
        this.freezeHistoryRepository = freezeHistoryRepository;
        this.notificationPublisherService = notificationPublisherService;
    }

    public void freezeAccount(String accountNumber, String frozenBy, String reason) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        
        account.setActive(false);
        accountRepository.save(account);

        AccountFreezeHistory history = new AccountFreezeHistory(
            accountNumber, 
            AccountFreezeHistory.FreezeStatus.FROZEN, 
            frozenBy, 
            reason
        );
        freezeHistoryRepository.save(history);

        notificationPublisherService.publish(new NotificationDto(
            UUID.randomUUID().toString(),
            account.getOwner().getUsername(),
            "ACCOUNT_FREEZE",
            "Account Frozen",
            "Your account " + accountNumber + " has been frozen. Reason: " + reason,
            java.time.Instant.now().toString()
        ));
    }

    public void unfreezeAccount(String accountNumber, String unfrozenBy) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        
        account.setActive(true);
        accountRepository.save(account);

        AccountFreezeHistory history = new AccountFreezeHistory(
            accountNumber, 
            AccountFreezeHistory.FreezeStatus.UNFROZEN, 
            unfrozenBy, 
            "Account unfrozen"
        );
        history.setUnfrozenAt(java.time.Instant.now());
        freezeHistoryRepository.save(history);

        notificationPublisherService.publish(new NotificationDto(
            UUID.randomUUID().toString(),
            account.getOwner().getUsername(),
            "ACCOUNT_UNFREEZE",
            "Account Unfrozen",
            "Your account " + accountNumber + " has been restored and is active.",
            java.time.Instant.now().toString()
        ));
    }

    public boolean isAccountFrozen(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        return !account.isActive();
    }

    public Page<AccountFreezeHistory> getFreezeHistory(String accountNumber, Pageable pageable) {
        return freezeHistoryRepository.findByAccountNumber(accountNumber, pageable);
    }
}
