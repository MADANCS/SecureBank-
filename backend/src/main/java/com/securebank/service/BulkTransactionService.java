package com.securebank.service;

import com.securebank.entity.TransactionV2;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.TransactionV2Repository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BulkTransactionService {

    private final TransactionService transactionService;
    private final AccountRepository accountRepository;

    public BulkTransactionService(TransactionService transactionService,
                                   AccountRepository accountRepository) {
        this.transactionService = transactionService;
        this.accountRepository = accountRepository;
    }

    public record BulkResult(int total, int succeeded, int failed, List<String> errors) {}

    /**
     * Parse and process a CSV bulk upload.
     * Expected CSV format (header required):
     *   from_account,to_account,amount,category,description
     */
    @Transactional
    public BulkResult processCsv(MultipartFile file, String initiatedBy) throws Exception {
        if (file.isEmpty()) throw new IllegalArgumentException("CSV file is empty");
        if (!file.getOriginalFilename().toLowerCase().endsWith(".csv")) {
            throw new IllegalArgumentException("Only CSV files are accepted");
        }

        List<String> errors = new ArrayList<>();
        int succeeded = 0;
        int total = 0;
        int lineNum = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                lineNum++;
                if (lineNum == 1) continue; // skip header

                line = line.trim();
                if (line.isEmpty()) continue;

                total++;
                String[] parts = line.split(",", -1);
                if (parts.length < 4) {
                    errors.add("Line " + lineNum + ": insufficient columns (need from_account,to_account,amount,category[,description])");
                    continue;
                }
                try {
                    String fromAccount = parts[0].trim();
                    String toAccount = parts[1].trim();
                    BigDecimal amount = new BigDecimal(parts[2].trim());
                    String category = parts[3].trim().toUpperCase();
                    String description = parts.length > 4 ? parts[4].trim() : "Bulk transfer";

                    if (amount.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("Amount must be positive");

                    TransactionV2.TransactionCategory cat;
                    try { cat = TransactionV2.TransactionCategory.valueOf(category); }
                    catch (IllegalArgumentException e) { cat = TransactionV2.TransactionCategory.OTHER; }

                    transactionService.createTransactionV2(fromAccount, toAccount, amount, cat,
                            UUID.randomUUID().toString(), initiatedBy, description);
                    succeeded++;
                } catch (Exception ex) {
                    errors.add("Line " + lineNum + ": " + ex.getMessage());
                }
            }
        }
        return new BulkResult(total, succeeded, total - succeeded, errors);
    }
}
