package com.securebank.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private boolean emailOnLogin = true;

    @Column(nullable = false)
    private boolean smsOnLogin = false;

    @Column(nullable = false)
    private boolean emailOnLargeTransaction = true;

    @Column(nullable = false)
    private boolean smsOnLargeTransaction = true;

    @Column(nullable = false)
    private BigDecimal largeTransactionThreshold = new BigDecimal("10000");

    @Column(nullable = false)
    private boolean lowBalanceAlert = true;

    @Column(nullable = false)
    private BigDecimal lowBalanceThreshold = new BigDecimal("1000");

    @Column(nullable = false)
    private boolean inAppNotifications = true;

    @Column(nullable = false)
    private boolean emailOnAccountFreeze = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public boolean isEmailOnLogin() { return emailOnLogin; }
    public void setEmailOnLogin(boolean emailOnLogin) { this.emailOnLogin = emailOnLogin; }

    public boolean isSmsOnLogin() { return smsOnLogin; }
    public void setSmsOnLogin(boolean smsOnLogin) { this.smsOnLogin = smsOnLogin; }

    public boolean isEmailOnLargeTransaction() { return emailOnLargeTransaction; }
    public void setEmailOnLargeTransaction(boolean emailOnLargeTransaction) { this.emailOnLargeTransaction = emailOnLargeTransaction; }

    public boolean isSmsOnLargeTransaction() { return smsOnLargeTransaction; }
    public void setSmsOnLargeTransaction(boolean smsOnLargeTransaction) { this.smsOnLargeTransaction = smsOnLargeTransaction; }

    public BigDecimal getLargeTransactionThreshold() { return largeTransactionThreshold; }
    public void setLargeTransactionThreshold(BigDecimal largeTransactionThreshold) { this.largeTransactionThreshold = largeTransactionThreshold; }

    public boolean isLowBalanceAlert() { return lowBalanceAlert; }
    public void setLowBalanceAlert(boolean lowBalanceAlert) { this.lowBalanceAlert = lowBalanceAlert; }

    public BigDecimal getLowBalanceThreshold() { return lowBalanceThreshold; }
    public void setLowBalanceThreshold(BigDecimal lowBalanceThreshold) { this.lowBalanceThreshold = lowBalanceThreshold; }

    public boolean isInAppNotifications() { return inAppNotifications; }
    public void setInAppNotifications(boolean inAppNotifications) { this.inAppNotifications = inAppNotifications; }

    public boolean isEmailOnAccountFreeze() { return emailOnAccountFreeze; }
    public void setEmailOnAccountFreeze(boolean emailOnAccountFreeze) { this.emailOnAccountFreeze = emailOnAccountFreeze; }
}
