package com.securebank.config;

import com.securebank.entity.Account;
import com.securebank.entity.KycStatus;
import com.securebank.entity.User;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@Profile("dev")
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, AccountRepository accountRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() == 0) {
            // Create testuser
            User testUser = new User();
            testUser.setUsername("testuser");
            testUser.setPassword(passwordEncoder.encode("Test@1234"));
            testUser.setEmail("test@securebank.com");
            testUser.setRole("USER");
            testUser.setKycStatus(KycStatus.VERIFIED);
            testUser.setActive(true);
            testUser = userRepository.save(testUser);

            Account testUserAccount1 = createAccount(testUser, "SAVINGS", new BigDecimal("500000.00"));
            Account testUserAccount2 = createAccount(testUser, "CURRENT", new BigDecimal("150000.00"));
            
            // Create another user for transfer tests
            User recipient = new User();
            recipient.setUsername("recipient");
            recipient.setPassword(passwordEncoder.encode("Test@1234"));
            recipient.setEmail("recipient@securebank.com");
            recipient.setRole("USER");
            recipient.setKycStatus(KycStatus.VERIFIED);
            recipient.setActive(true);
            recipient = userRepository.save(recipient);

            Account recipientAccount = createAccount(recipient, "SAVINGS", new BigDecimal("10000.00"));

            // Create admin user
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("Admin@1234"));
            admin.setEmail("admin@securebank.com");
            admin.setRole("ADMIN");
            admin.setKycStatus(KycStatus.VERIFIED);
            admin.setActive(true);
            userRepository.save(admin);
            
            System.out.println("Seeded initial test users and accounts successfully.");
        } else {
            // Update testuser if they don't have accounts
            User testUser = userRepository.findByUsername("testuser").orElse(null);
            if (testUser != null && testUser.getAccounts().isEmpty()) {
                createAccount(testUser, "SAVINGS", new BigDecimal("500000.00"));
                createAccount(testUser, "CURRENT", new BigDecimal("150000.00"));
                System.out.println("Seeded testuser accounts successfully.");
            }
        }
    }

    private Account createAccount(User user, String type, BigDecimal initialBalance) {
        Account account = new Account();
        account.setOwner(user);
        account.setAccountType(type);
        
        String prefix = switch (type.toUpperCase()) {
            case "SAVINGS" -> "KAR-SAV";
            case "CURRENT" -> "KAR-CUR";
            case "FIXED" -> "KAR-FD";
            default -> "KAR-ACC";
        };
        account.setAccountNumber(prefix + UUID.randomUUID().toString().substring(0, 10).toUpperCase());
        account.setBalance(initialBalance);
        account.setActive(true);
        user.getAccounts().add(account);
        return accountRepository.save(account);
    }
}
