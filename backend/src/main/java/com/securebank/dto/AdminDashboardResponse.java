package com.securebank.dto;

public class AdminDashboardResponse {
    private long totalUsers;
    private long totalTransactions;
    private long activeAccounts;
    private long frozenAccounts;
    private String dailyRevenue;
    private String monthlyRevenue;

    public AdminDashboardResponse(long totalUsers, long totalTransactions, long activeAccounts, 
                                  long frozenAccounts, String dailyRevenue, String monthlyRevenue) {
        this.totalUsers = totalUsers;
        this.totalTransactions = totalTransactions;
        this.activeAccounts = activeAccounts;
        this.frozenAccounts = frozenAccounts;
        this.dailyRevenue = dailyRevenue;
        this.monthlyRevenue = monthlyRevenue;
    }

    public long getTotalUsers() { return totalUsers; }
    public long getTotalTransactions() { return totalTransactions; }
    public long getActiveAccounts() { return activeAccounts; }
    public long getFrozenAccounts() { return frozenAccounts; }
    public String getDailyRevenue() { return dailyRevenue; }
    public String getMonthlyRevenue() { return monthlyRevenue; }
}
