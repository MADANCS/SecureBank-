package com.securebank.controller;

import com.securebank.dto.TransferRequest;
import com.securebank.entity.Transaction;
import com.securebank.repository.TransactionRepository;
import com.securebank.repository.TransactionV2Repository;
import com.securebank.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService transactionService;
    private final TransactionRepository transactionRepository;
    private final TransactionV2Repository transactionV2Repository;

    public TransactionController(TransactionService transactionService,
                                 TransactionRepository transactionRepository,
                                 TransactionV2Repository transactionV2Repository) {
        this.transactionService = transactionService;
        this.transactionRepository = transactionRepository;
        this.transactionV2Repository = transactionV2Repository;
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/transfer")
    public ResponseEntity<Transaction> transfer(@AuthenticationPrincipal String username,
                                                @RequestBody @Valid TransferRequest request) {
        return ResponseEntity.ok(transactionService.transfer(request, username));
    }

    @GetMapping("/spending-by-category")
    public ResponseEntity<?> getSpendingByCategory(@AuthenticationPrincipal String username) {
        return ResponseEntity.ok(transactionService.getSpendingByCategory(username));
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<?> getTransactionStatus(@PathVariable("id") Long id) {
        return transactionRepository.findById(id)
            .map(tx -> ResponseEntity.ok(java.util.Map.of(
                "id", tx.getId(),
                "status", tx.getStatus(),
                "fromAccount", tx.getFromAccount(),
                "toAccount", tx.getToAccount(),
                "amount", tx.getAmount()
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<Page<Transaction>> getTransactions(
            @RequestParam("accountNumber") String accountNumber,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "fromDate", required = false) String fromDate,
            @RequestParam(name = "toDate", required = false) String toDate,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(transactionService.listTransactions(accountNumber, status, fromDate, toDate, pageable));
    }
}
