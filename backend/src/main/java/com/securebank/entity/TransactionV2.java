package com.securebank.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "transactions_v2", indexes = {
    @Index(name = "idx_transaction_from_account", columnList = "from_account"),
    @Index(name = "idx_transaction_to_account", columnList = "to_account"),
    @Index(name = "idx_transaction_status", columnList = "status"),
    @Index(name = "idx_transaction_created_at", columnList = "created_at")
})
public class TransactionV2 extends AuditModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fromAccount;

    @Column(nullable = false)
    private String toAccount;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status = TransactionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionCategory category;

    @Column(nullable = false, unique = true)
    private String idempotencyKey;


    @Column(length = 500)
    private String description;

    @Column
    private String referenceNumber;

    public enum TransactionStatus {
        PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
    }

    public enum TransactionCategory {
        FOOD, RENT, SALARY, EMI, UTILITIES, ENTERTAINMENT, HEALTHCARE, TRANSPORT, SHOPPING, OTHER
    }

    public TransactionV2() {
    }

    public TransactionV2(String fromAccount, String toAccount, BigDecimal amount, 
                         TransactionCategory category, String idempotencyKey, String createdBy) {
        this.fromAccount = fromAccount;
        this.toAccount = toAccount;
        this.amount = amount;
        this.category = category;
        this.idempotencyKey = idempotencyKey;
        super.setCreatedBy(createdBy);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFromAccount() { return fromAccount; }
    public void setFromAccount(String fromAccount) { this.fromAccount = fromAccount; }

    public String getToAccount() { return toAccount; }
    public void setToAccount(String toAccount) { this.toAccount = toAccount; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public TransactionStatus getStatus() { return status; }
    public void setStatus(TransactionStatus status) { this.status = status; }

    public TransactionCategory getCategory() { return category; }
    public void setCategory(TransactionCategory category) { this.category = category; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }


    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
}
