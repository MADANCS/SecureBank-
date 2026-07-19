package com.securebank.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "spending_limits")
public class SpendingLimit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private BigDecimal dailyLimit;

    @Column(nullable = false)
    private BigDecimal weeklyLimit;

    @Column(nullable = false)
    private Boolean enabled = true;

    public SpendingLimit() {
    }

    public SpendingLimit(String username, BigDecimal dailyLimit, BigDecimal weeklyLimit) {
        this.username = username;
        this.dailyLimit = dailyLimit;
        this.weeklyLimit = weeklyLimit;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public BigDecimal getDailyLimit() { return dailyLimit; }
    public void setDailyLimit(BigDecimal dailyLimit) { this.dailyLimit = dailyLimit; }

    public BigDecimal getWeeklyLimit() { return weeklyLimit; }
    public void setWeeklyLimit(BigDecimal weeklyLimit) { this.weeklyLimit = weeklyLimit; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}
