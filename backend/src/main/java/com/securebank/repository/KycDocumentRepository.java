package com.securebank.repository;

import com.securebank.entity.KycDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {
    @Query("SELECT k FROM KycDocument k WHERE k.username = :username AND k.deletedAt IS NULL ORDER BY k.uploadedAt DESC")
    List<KycDocument> findActiveByUsername(String username);

    @Query("SELECT k FROM KycDocument k WHERE k.username = :username AND k.documentType = :documentType AND k.deletedAt IS NULL")
    Optional<KycDocument> findActiveByUsernameAndType(String username, KycDocument.DocumentType documentType);

    @Query("SELECT k FROM KycDocument k WHERE k.deletedAt IS NULL ORDER BY k.uploadedAt DESC")
    List<KycDocument> findAllActive();

    @Query("SELECT k FROM KycDocument k WHERE k.verificationStatus = :status AND k.deletedAt IS NULL ORDER BY k.uploadedAt DESC")
    List<KycDocument> findByVerificationStatus(KycDocument.VerificationStatus status);
}
