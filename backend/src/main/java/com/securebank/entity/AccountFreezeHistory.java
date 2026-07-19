package com.securebank.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "account_freeze_history")
public class AccountFreezeHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String accountNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FreezeStatus status;

    @Column(nullable = false)
    private String frozenBy;

    @Column(nullable = false)
    private Instant frozenAt;

    @Column
    private Instant unfrozenAt;

    @Column(length = 500)
    private String reason;

    public enum FreezeStatus {
        FROZEN, UNFROZEN
    }

    public AccountFreezeHistory() {
    }

    public AccountFreezeHistory(String accountNumber, FreezeStatus status, String frozenBy, String reason) {
        this.accountNumber = accountNumber;
        this.status = status;
        this.frozenBy = frozenBy;
        this.reason = reason;
        this.frozenAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public FreezeStatus getStatus() { return status; }
    public void setStatus(FreezeStatus status) { this.status = status; }

    public String getFrozenBy() { return frozenBy; }
    public void setFrozenBy(String frozenBy) { this.frozenBy = frozenBy; }

    public Instant getFrozenAt() { return frozenAt; }
    public void setFrozenAt(Instant frozenAt) { this.frozenAt = frozenAt; }

    public Instant getUnfrozenAt() { return unfrozenAt; }
    public void setUnfrozenAt(Instant unfrozenAt) { this.unfrozenAt = unfrozenAt; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
