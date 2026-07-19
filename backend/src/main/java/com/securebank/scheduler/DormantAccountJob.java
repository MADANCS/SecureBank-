package com.securebank.scheduler;

import com.securebank.entity.Account;
import com.securebank.repository.AccountRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
public class DormantAccountJob {
    private final AccountRepository accountRepository;

    public DormantAccountJob(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void detectDormantAccounts() {
        List<Account> accounts = accountRepository.findAll();
        Instant cutoff = Instant.now().minus(Duration.ofDays(365));
        for (Account account : accounts) {
            if (account.getCreatedAt().isBefore(cutoff) && account.getBalance().compareTo(BigDecimal.ZERO) == 0 && account.isActive()) {
                account.setActive(false);
                accountRepository.save(account);
            }
        }
    }
}
