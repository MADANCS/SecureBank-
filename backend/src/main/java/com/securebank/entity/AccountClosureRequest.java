package com.securebank.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "account_closure_requests", indexes = {
    @Index(name = "idx_closure_account", columnList = "account_number"),
    @Index(name = "idx_closure_username", columnList = "requested_by"),
    @Index(name = "idx_closure_status", columnList = "status")
})
public class AccountClosureRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String accountNumber;

    @Column(nullable = false)
    private String requestedBy;

    @Column(nullable = false)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClosureStatus status = ClosureStatus.PENDING;

    @Column
    private String reviewedBy;

    @Column
    private Instant reviewedAt;

    @Column
    private String reviewNote;

    @Column(nullable = false)
    private Instant requestedAt = Instant.now();

    public enum ClosureStatus {
        PENDING, APPROVED, REJECTED, COMPLETED
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public ClosureStatus getStatus() { return status; }
    public void setStatus(ClosureStatus status) { this.status = status; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String reviewNote) { this.reviewNote = reviewNote; }

    public Instant getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Instant requestedAt) { this.requestedAt = requestedAt; }
}
