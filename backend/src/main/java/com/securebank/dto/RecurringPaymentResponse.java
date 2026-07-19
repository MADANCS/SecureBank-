package com.securebank.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class RecurringPaymentResponse {
    private Long id;
    private String accountNumber;
    private String billType;
    private String reference;
    private BigDecimal amount;
    private String frequency;
    private Instant nextExecutionAt;
    private boolean enabled;
    private String status;
    private Instant lastExecutedAt;
    private String lastExecutionStatus;

    public RecurringPaymentResponse() {
    }

    public RecurringPaymentResponse(Long id, String accountNumber, String billType, String reference, BigDecimal amount, String frequency, Instant nextExecutionAt, boolean enabled, String status, Instant lastExecutedAt, String lastExecutionStatus) {
        this.id = id;
        this.accountNumber = accountNumber;
        this.billType = billType;
        this.reference = reference;
        this.amount = amount;
        this.frequency = frequency;
        this.nextExecutionAt = nextExecutionAt;
        this.enabled = enabled;
        this.status = status;
        this.lastExecutedAt = lastExecutedAt;
        this.lastExecutionStatus = lastExecutionStatus;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getBillType() {
        return billType;
    }

    public void setBillType(String billType) {
        this.billType = billType;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public Instant getNextExecutionAt() {
        return nextExecutionAt;
    }

    public void setNextExecutionAt(Instant nextExecutionAt) {
        this.nextExecutionAt = nextExecutionAt;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getLastExecutedAt() {
        return lastExecutedAt;
    }

    public void setLastExecutedAt(Instant lastExecutedAt) {
        this.lastExecutedAt = lastExecutedAt;
    }

    public String getLastExecutionStatus() {
        return lastExecutionStatus;
    }

    public void setLastExecutionStatus(String lastExecutionStatus) {
        this.lastExecutionStatus = lastExecutionStatus;
    }
}
