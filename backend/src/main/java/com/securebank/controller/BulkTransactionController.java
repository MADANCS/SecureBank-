package com.securebank.controller;

import com.securebank.service.BulkTransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/transactions")
public class BulkTransactionController {

    private final BulkTransactionService bulkTransactionService;

    public BulkTransactionController(BulkTransactionService bulkTransactionService) {
        this.bulkTransactionService = bulkTransactionService;
    }

    /**
     * Upload a CSV file for bulk transaction processing.
     * CSV format: from_account,to_account,amount,category,description
     */
    @PostMapping("/bulk-upload")
    public ResponseEntity<Map<String, Object>> bulkUpload(
            Authentication auth,
            @RequestParam("file") MultipartFile file) {
        try {
            BulkTransactionService.BulkResult result = bulkTransactionService.processCsv(file, auth.getName());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "total", result.total(),
                    "succeeded", result.succeeded(),
                    "failed", result.failed(),
                    "errors", result.errors()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Processing failed: " + e.getMessage()));
        }
    }

    /** Download a CSV template for bulk upload */
    @GetMapping("/bulk-upload/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        String csv = "from_account,to_account,amount,category,description\n" +
                     "ACC001,ACC002,5000.00,RENT,Monthly rent payment\n" +
                     "ACC001,ACC003,1200.00,FOOD,Grocery bill\n";
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=bulk_transfer_template.csv")
                .header("Content-Type", "text/csv")
                .body(csv.getBytes());
    }
}
