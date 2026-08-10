package com.securebank;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("dev")
class SecureBankApplicationTests {

    @Test
    void contextLoads() {
        // Verifies Spring application context initializes without error
        assertTrue(true, "Application context loaded successfully");
    }
}
