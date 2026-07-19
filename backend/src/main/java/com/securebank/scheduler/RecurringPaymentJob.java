package com.securebank.scheduler;

import com.securebank.service.RecurringPaymentService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RecurringPaymentJob {
    private final RecurringPaymentService recurringPaymentService;

    public RecurringPaymentJob(RecurringPaymentService recurringPaymentService) {
        this.recurringPaymentService = recurringPaymentService;
    }

    @Scheduled(cron = "0 0 3 * * ?")
    public void runRecurringPayments() {
        recurringPaymentService.executeDueRecurringPayments();
    }
}
