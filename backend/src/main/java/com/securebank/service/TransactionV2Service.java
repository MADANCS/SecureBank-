package com.securebank.service;

import com.securebank.entity.TransactionV2;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class TransactionV2Service {
    
    public String createTransactionV2(String fromAccount, String toAccount, 
                                      java.math.BigDecimal amount,
                                      TransactionV2.TransactionCategory category,
                                      String idempotencyKey, String createdBy) {
        // Create and persist transaction
        TransactionV2 transaction = new TransactionV2(fromAccount, toAccount, amount, category, idempotencyKey, createdBy);
        transaction.setStatus(TransactionV2.TransactionStatus.PENDING);
        transaction.setReferenceNumber(UUID.randomUUID().toString());
        
        // Save to repository (would be done here)
        return transaction.getReferenceNumber();
    }

    public java.util.Map<String, Object> getSpendingByCategory(String username) {
        // Return spending breakdown by category for analytics
        return java.util.Map.of();
    }
}
