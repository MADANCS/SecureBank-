package com.securebank.dto;

import java.math.BigDecimal;

public class LoanSummaryResponse {
    private long totalApplications;
    private long pendingApplications;
    private long approvedApplications;
    private long rejectedApplications;
    private long delinquentLoans;
    private BigDecimal totalOutstandingBalance;
    private BigDecimal totalDisbursedAmount;

    public LoanSummaryResponse() {
    }

    public LoanSummaryResponse(long totalApplications, long pendingApplications, long approvedApplications, long rejectedApplications, long delinquentLoans, BigDecimal totalOutstandingBalance, BigDecimal totalDisbursedAmount) {
        this.totalApplications = totalApplications;
        this.pendingApplications = pendingApplications;
        this.approvedApplications = approvedApplications;
        this.rejectedApplications = rejectedApplications;
        this.delinquentLoans = delinquentLoans;
        this.totalOutstandingBalance = totalOutstandingBalance;
        this.totalDisbursedAmount = totalDisbursedAmount;
    }

    public long getTotalApplications() {
        return totalApplications;
    }

    public void setTotalApplications(long totalApplications) {
        this.totalApplications = totalApplications;
    }

    public long getPendingApplications() {
        return pendingApplications;
    }

    public void setPendingApplications(long pendingApplications) {
        this.pendingApplications = pendingApplications;
    }

    public long getApprovedApplications() {
        return approvedApplications;
    }

    public void setApprovedApplications(long approvedApplications) {
        this.approvedApplications = approvedApplications;
    }

    public long getRejectedApplications() {
        return rejectedApplications;
    }

    public void setRejectedApplications(long rejectedApplications) {
        this.rejectedApplications = rejectedApplications;
    }

    public long getDelinquentLoans() {
        return delinquentLoans;
    }

    public void setDelinquentLoans(long delinquentLoans) {
        this.delinquentLoans = delinquentLoans;
    }

    public BigDecimal getTotalOutstandingBalance() {
        return totalOutstandingBalance;
    }

    public void setTotalOutstandingBalance(BigDecimal totalOutstandingBalance) {
        this.totalOutstandingBalance = totalOutstandingBalance;
    }

    public BigDecimal getTotalDisbursedAmount() {
        return totalDisbursedAmount;
    }

    public void setTotalDisbursedAmount(BigDecimal totalDisbursedAmount) {
        this.totalDisbursedAmount = totalDisbursedAmount;
    }
}
