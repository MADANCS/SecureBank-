package com.securebank.service;

import com.securebank.entity.Account;
import com.securebank.entity.SpendingLimit;
import com.securebank.entity.User;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.SpendingLimitRepository;
import com.securebank.repository.TransactionRepository;
import com.securebank.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class SpendingLimitService {
    private final SpendingLimitRepository spendingLimitRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public SpendingLimitService(SpendingLimitRepository spendingLimitRepository,
                                TransactionRepository transactionRepository,
                                AccountRepository accountRepository,
                                UserRepository userRepository) {
        this.spendingLimitRepository = spendingLimitRepository;
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    public void setSpendingLimit(String username, BigDecimal dailyLimit, BigDecimal weeklyLimit) {
        SpendingLimit limit = spendingLimitRepository.findByUsername(username)
            .orElse(new SpendingLimit(username, dailyLimit, weeklyLimit));
        limit.setDailyLimit(dailyLimit);
        limit.setWeeklyLimit(weeklyLimit);
        spendingLimitRepository.save(limit);
    }

    public SpendingLimit getSpendingLimit(String username) {
        return spendingLimitRepository.findByUsername(username)
            .orElseGet(() -> new SpendingLimit(username, BigDecimal.valueOf(50000), BigDecimal.valueOf(250000)));
    }

    /**
     * Validates that the requested transfer does not breach the user's configured daily/weekly
     * spending limits, using real rolling totals accumulated in the transactions table.
     */
    public void enforceSpendingLimits(String username, BigDecimal requestedAmount) {
        SpendingLimit limit = getSpendingLimit(username);
        if (!Boolean.TRUE.equals(limit.getEnabled())) return;

        // Resolve user to get their accounts
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return;

        List<String> accountNumbers = accountRepository.findAllByOwner(user)
            .stream()
            .map(Account::getAccountNumber)
            .toList();

        if (accountNumbers.isEmpty()) return;

        Instant startOfDay  = Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant startOfWeek = Instant.now().minus(7, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS);

        BigDecimal todaySpent = transactionRepository.sumOutgoingFromAccounts(accountNumbers, startOfDay);
        BigDecimal weekSpent  = transactionRepository.sumOutgoingFromAccounts(accountNumbers, startOfWeek);

        if (limit.getDailyLimit() != null &&
            todaySpent.add(requestedAmount).compareTo(limit.getDailyLimit()) > 0) {
            throw new IllegalArgumentException(
                String.format("Daily spending limit of ₹%.2f exceeded. Already spent ₹%.2f today.",
                    limit.getDailyLimit(), todaySpent));
        }

        if (limit.getWeeklyLimit() != null &&
            weekSpent.add(requestedAmount).compareTo(limit.getWeeklyLimit()) > 0) {
            throw new IllegalArgumentException(
                String.format("Weekly spending limit of ₹%.2f exceeded. Already spent ₹%.2f this week.",
                    limit.getWeeklyLimit(), weekSpent));
        }
    }
}
