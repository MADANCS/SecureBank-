package com.securebank.service;

import com.securebank.entity.Transaction;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class FraudDetectionService {
    
    // Threshold for high value transaction (e.g., 2,00,000 INR)
    private static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("200000.00");
    
    /**
     * Analyzes a transaction for potential fraud.
     * @param transaction The transaction to analyze
     * @return An Optional containing the reason for fraud suspicion, or empty if clean.
     */
    public Optional<String> analyzeTransaction(Transaction transaction) {
        if (transaction == null) {
            return Optional.empty();
        }
        
        // 1. High value transfer check
        if (transaction.getAmount().compareTo(HIGH_VALUE_THRESHOLD) > 0) {
            return Optional.of("Transaction amount exceeds automated processing limits (₹2,00,000). Manual admin approval required.");
        }
        
        // 2. We can add velocity checks here (e.g. 5+ transfers in last hour).
        // For simplicity, we just use the threshold.
        
        return Optional.empty();
    }
}
