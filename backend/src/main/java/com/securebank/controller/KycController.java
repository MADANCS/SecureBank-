package com.securebank.controller;

import com.securebank.entity.KycDocument;
import com.securebank.service.KycService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/kyc")
public class KycController {

    private final KycService kycService;

    public KycController(KycService kycService) {
        this.kycService = kycService;
    }

    /** Upload a KYC document (AADHAAR, PAN, PASSPORT, etc.) */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            Authentication auth,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType) {
        try {
            KycDocument.DocumentType type = KycDocument.DocumentType.valueOf(documentType.toUpperCase());
            KycDocument doc = kycService.uploadDocument(auth.getName(), file, type);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Document uploaded successfully. Pending verification.",
                    "documentId", doc.getId(),
                    "status", doc.getVerificationStatus()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Upload failed: " + e.getMessage()));
        }
    }

    /** Get all KYC documents for the authenticated user */
    @GetMapping("/documents")
    public ResponseEntity<List<KycDocument>> getDocuments(Authentication auth) {
        return ResponseEntity.ok(kycService.getDocuments(auth.getName()));
    }

    /** Admin: get all pending KYC documents */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<KycDocument>> getPendingDocuments() {
        return ResponseEntity.ok(kycService.getPendingDocuments());
    }

    /** Admin: approve or reject a KYC document */
    @PostMapping("/{docId}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> verifyDocument(
            Authentication auth,
            @PathVariable Long docId,
            @RequestBody Map<String, Object> body) {
        boolean approved = Boolean.parseBoolean(body.getOrDefault("approved", "false").toString());
        String rejectionReason = (String) body.get("rejectionReason");
        KycDocument doc = kycService.verifyDocument(docId, approved, auth.getName(), rejectionReason);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", approved ? "Document approved" : "Document rejected",
                "status", doc.getVerificationStatus()
        ));
    }
}
