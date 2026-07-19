package com.securebank.scheduler;

import com.securebank.service.LoanService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class LoanEmiJob {
    private final LoanService loanService;

    public LoanEmiJob(LoanService loanService) {
        this.loanService = loanService;
    }

    @Scheduled(cron = "0 0 2 * * ?")
    public void runLoanEmiProcessing() {
        loanService.executeLoanEmis();
    }
}
