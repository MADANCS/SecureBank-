package com.securebank.scheduler;

import com.securebank.entity.Account;
import com.securebank.repository.AccountRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
public class InterestScheduler {
    private final AccountRepository accountRepository;

    public InterestScheduler(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Scheduled(cron = "0 0 0 1 * ?")
    @Transactional
    public void creditMonthlyInterest() {
        List<Account> savingsAccounts = accountRepository.findAll();
        for (Account account : savingsAccounts) {
            if ("SAVINGS".equalsIgnoreCase(account.getAccountType()) && account.isActive()) {
                BigDecimal interest = account.getBalance().multiply(BigDecimal.valueOf(0.0035));
                account.setBalance(account.getBalance().add(interest));
                accountRepository.save(account);
            }
        }
    }
}
