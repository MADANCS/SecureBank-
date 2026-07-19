package com.securebank.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class LoanApplicationResponse {
    private Long id;
    private String applicantUsername;
    private String accountNumber;
    private String loanType;
    private BigDecimal principalAmount;
    private int tenureMonths;
    private BigDecimal interestRate;
    private BigDecimal totalPayable;
    private BigDecimal emiAmount;
    private BigDecimal remainingBalance;
    private String status;
    private Instant approvedAt;
    private String approvedBy;
    private Instant nextEmiAt;
    private Instant lastPaymentAt;

    public LoanApplicationResponse() {
    }

    public LoanApplicationResponse(Long id, String applicantUsername, String accountNumber, String loanType, BigDecimal principalAmount, int tenureMonths, BigDecimal interestRate, BigDecimal totalPayable, BigDecimal emiAmount, BigDecimal remainingBalance, String status, Instant approvedAt, String approvedBy, Instant nextEmiAt, Instant lastPaymentAt) {
        this.id = id;
        this.applicantUsername = applicantUsername;
        this.accountNumber = accountNumber;
        this.loanType = loanType;
        this.principalAmount = principalAmount;
        this.tenureMonths = tenureMonths;
        this.interestRate = interestRate;
        this.totalPayable = totalPayable;
        this.emiAmount = emiAmount;
        this.remainingBalance = remainingBalance;
        this.status = status;
        this.approvedAt = approvedAt;
        this.approvedBy = approvedBy;
        this.nextEmiAt = nextEmiAt;
        this.lastPaymentAt = lastPaymentAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getApplicantUsername() {
        return applicantUsername;
    }

    public void setApplicantUsername(String applicantUsername) {
        this.applicantUsername = applicantUsername;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getLoanType() {
        return loanType;
    }

    public void setLoanType(String loanType) {
        this.loanType = loanType;
    }

    public BigDecimal getPrincipalAmount() {
        return principalAmount;
    }

    public void setPrincipalAmount(BigDecimal principalAmount) {
        this.principalAmount = principalAmount;
    }

    public int getTenureMonths() {
        return tenureMonths;
    }

    public void setTenureMonths(int tenureMonths) {
        this.tenureMonths = tenureMonths;
    }

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }

    public BigDecimal getTotalPayable() {
        return totalPayable;
    }

    public void setTotalPayable(BigDecimal totalPayable) {
        this.totalPayable = totalPayable;
    }

    public BigDecimal getEmiAmount() {
        return emiAmount;
    }

    public void setEmiAmount(BigDecimal emiAmount) {
        this.emiAmount = emiAmount;
    }

    public BigDecimal getRemainingBalance() {
        return remainingBalance;
    }

    public void setRemainingBalance(BigDecimal remainingBalance) {
        this.remainingBalance = remainingBalance;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public Instant getNextEmiAt() {
        return nextEmiAt;
    }

    public void setNextEmiAt(Instant nextEmiAt) {
        this.nextEmiAt = nextEmiAt;
    }

    public Instant getLastPaymentAt() {
        return lastPaymentAt;
    }

    public void setLastPaymentAt(Instant lastPaymentAt) {
        this.lastPaymentAt = lastPaymentAt;
    }
}
