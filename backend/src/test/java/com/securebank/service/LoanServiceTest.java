package com.securebank.service;

import com.securebank.entity.Account;
import com.securebank.entity.LoanApplication;
import com.securebank.entity.LoanStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class LoanServiceTest {

    private LoanApplication loan;
    private Account account;

    @BeforeEach
    void setUp() {
        loan = new LoanApplication();
        loan.setId(101L);
        loan.setAccountNumber("KAR-SAVA41E771B-8");
        loan.setPrincipalAmount(new BigDecimal("100000.00"));
        loan.setStatus(LoanStatus.PENDING);

        account = new Account();
        account.setAccountNumber("KAR-SAVA41E771B-8");
        account.setBalance(new BigDecimal("500000.00"));
    }

    @Test
    void testLoanApprovalBalanceAddition() {
        BigDecimal initialBalance = account.getBalance();
        BigDecimal loanAmount = loan.getPrincipalAmount();

        account.setBalance(initialBalance.add(loanAmount));
        loan.setStatus(LoanStatus.APPROVED);

        assertEquals(new BigDecimal("600000.00"), account.getBalance());
        assertEquals(LoanStatus.APPROVED, loan.getStatus());
    }
}
