package com.securebank.service;

import com.securebank.entity.NotificationPreference;
import com.securebank.repository.NotificationPreferenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;

    public NotificationPreferenceService(NotificationPreferenceRepository preferenceRepository) {
        this.preferenceRepository = preferenceRepository;
    }

    public NotificationPreference getOrCreate(String username) {
        return preferenceRepository.findByUsername(username).orElseGet(() -> {
            NotificationPreference pref = new NotificationPreference();
            pref.setUsername(username);
            return preferenceRepository.save(pref);
        });
    }

    @Transactional
    public NotificationPreference update(String username,
                                         boolean emailOnLogin,
                                         boolean smsOnLogin,
                                         boolean emailOnLargeTransaction,
                                         boolean smsOnLargeTransaction,
                                         BigDecimal largeTransactionThreshold,
                                         boolean lowBalanceAlert,
                                         BigDecimal lowBalanceThreshold,
                                         boolean inAppNotifications,
                                         boolean emailOnAccountFreeze) {
        NotificationPreference pref = getOrCreate(username);
        pref.setEmailOnLogin(emailOnLogin);
        pref.setSmsOnLogin(smsOnLogin);
        pref.setEmailOnLargeTransaction(emailOnLargeTransaction);
        pref.setSmsOnLargeTransaction(smsOnLargeTransaction);
        if (largeTransactionThreshold != null) pref.setLargeTransactionThreshold(largeTransactionThreshold);
        pref.setLowBalanceAlert(lowBalanceAlert);
        if (lowBalanceThreshold != null) pref.setLowBalanceThreshold(lowBalanceThreshold);
        pref.setInAppNotifications(inAppNotifications);
        pref.setEmailOnAccountFreeze(emailOnAccountFreeze);
        return preferenceRepository.save(pref);
    }
}
