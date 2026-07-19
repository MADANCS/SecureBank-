package com.securebank.controller.v1;

import com.securebank.dto.PaymentResponse;
import com.securebank.entity.TransactionV2;
import com.securebank.service.SpendingLimitService;
import com.securebank.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionControllerV1 {
    private final TransactionService transactionService;
    private final SpendingLimitService spendingLimitService;

    public TransactionControllerV1(TransactionService transactionService, SpendingLimitService spendingLimitService) {
        this.transactionService = transactionService;
        this.spendingLimitService = spendingLimitService;
    }

    @PostMapping("/transfer")
    public ResponseEntity<?> transferFunds(
            @RequestParam String fromAccount,
            @RequestParam String toAccount,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false, defaultValue = "OTHER") String category,
            @RequestParam(required = false, defaultValue = "Direct Transfer") String description,
            @AuthenticationPrincipal String username,
            HttpServletRequest request) {
        
        try {
            // Enforce spending limits (throws if breached)
            spendingLimitService.enforceSpendingLimits(username, amount);

            // Create transaction with idempotency
            String idempotencyKey = UUID.randomUUID().toString();
            TransactionV2.TransactionCategory transactionCategory = 
                TransactionV2.TransactionCategory.valueOf(category.toUpperCase());
            
            String referenceNumber = transactionService.createTransactionV2(
                fromAccount, toAccount, amount, transactionCategory, idempotencyKey, username, description
            );

            return ResponseEntity.ok(new PaymentResponse(
                "SUCCESS", 
                "Transfer initiated", 
                referenceNumber
            ));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new PaymentResponse("FAILED", ex.getMessage(), ""));
        }
    }

    @GetMapping("/category-breakdown")
    public ResponseEntity<?> getCategoryBreakdown(@AuthenticationPrincipal String username) {
        // Returns spending by category for dashboard analytics
        return ResponseEntity.ok(transactionService.getSpendingByCategory(username));
    }
}

