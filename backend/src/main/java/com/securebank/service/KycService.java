package com.securebank.service;

import com.securebank.entity.KycDocument;
import com.securebank.entity.KycStatus;
import com.securebank.entity.User;
import com.securebank.repository.KycDocumentRepository;
import com.securebank.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class KycService {

    private final KycDocumentRepository kycDocumentRepository;
    private final UserRepository userRepository;

    @Value("${app.kyc.upload-dir:./kyc-uploads}")
    private String uploadDir;

    public KycService(KycDocumentRepository kycDocumentRepository, UserRepository userRepository) {
        this.kycDocumentRepository = kycDocumentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public KycDocument uploadDocument(String username, MultipartFile file, KycDocument.DocumentType documentType) throws IOException {
        // Validate file
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        long maxSize = 5 * 1024 * 1024; // 5 MB
        if (file.getSize() > maxSize) throw new IllegalArgumentException("File exceeds 5MB limit");

        String ct = file.getContentType();
        if (ct == null || (!ct.startsWith("image/") && !ct.equals("application/pdf"))) {
            throw new IllegalArgumentException("Only images and PDFs are allowed");
        }

        // Soft-delete any existing doc of the same type
        kycDocumentRepository.findActiveByUsernameAndType(username, documentType)
                .ifPresent(existing -> {
                    existing.setDeletedAt(Instant.now());
                    kycDocumentRepository.save(existing);
                });

        // Store file
        Path dir = Paths.get(uploadDir, username);
        Files.createDirectories(dir);
        String storedName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path target = dir.resolve(storedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // Persist metadata
        KycDocument doc = new KycDocument();
        doc.setUsername(username);
        doc.setDocumentType(documentType);
        doc.setFileName(file.getOriginalFilename());
        doc.setFilePath(target.toString());
        doc.setContentType(ct);
        doc.setFileSize(file.getSize());
        doc.setVerificationStatus(KycDocument.VerificationStatus.PENDING);
        doc.setUploadedAt(Instant.now());
        return kycDocumentRepository.save(doc);
    }

    public List<KycDocument> getDocuments(String username) {
        return kycDocumentRepository.findActiveByUsername(username);
    }

    @Transactional
    public KycDocument verifyDocument(Long docId, boolean approved, String adminUsername, String rejectionReason) {
        KycDocument doc = kycDocumentRepository.findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        doc.setVerificationStatus(approved ? KycDocument.VerificationStatus.APPROVED : KycDocument.VerificationStatus.REJECTED);
        doc.setVerifiedBy(adminUsername);
        doc.setVerifiedAt(Instant.now());
        if (!approved) doc.setRejectionReason(rejectionReason);
        kycDocumentRepository.save(doc);

        // Update user KYC status if all docs approved
        if (approved) {
            List<KycDocument> docs = kycDocumentRepository.findActiveByUsername(doc.getUsername());
            boolean hasAadhaar = docs.stream().anyMatch(d -> d.getDocumentType() == KycDocument.DocumentType.AADHAAR && d.getVerificationStatus() == KycDocument.VerificationStatus.APPROVED);
            boolean hasPan = docs.stream().anyMatch(d -> d.getDocumentType() == KycDocument.DocumentType.PAN && d.getVerificationStatus() == KycDocument.VerificationStatus.APPROVED);
            if (hasAadhaar && hasPan) {
                userRepository.findByUsername(doc.getUsername()).ifPresent(user -> {
                    user.setKycStatus(KycStatus.VERIFIED);
                    userRepository.save(user);
                });
            }
        }
        return doc;
    }

    public List<KycDocument> getPendingDocuments() {
        return kycDocumentRepository.findByVerificationStatus(KycDocument.VerificationStatus.PENDING);
    }
}
