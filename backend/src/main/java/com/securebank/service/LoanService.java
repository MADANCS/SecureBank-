package com.securebank.service;

import com.securebank.dto.LoanApplicationRequest;
import com.securebank.dto.NotificationDto;
import com.securebank.entity.Account;
import com.securebank.entity.KycStatus;
import com.securebank.entity.LoanApplication;
import com.securebank.entity.LoanStatus;
import com.securebank.dto.LoanSummaryResponse;
import com.securebank.entity.Transaction;
import com.securebank.entity.User;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.LoanApplicationRepository;
import com.securebank.repository.TransactionRepository;
import com.securebank.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class LoanService {
    private final LoanApplicationRepository loanApplicationRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final NotificationPublisherService notificationPublisherService;

    public LoanService(LoanApplicationRepository loanApplicationRepository,
                       AccountRepository accountRepository,
                       TransactionRepository transactionRepository,
                       UserRepository userRepository,
                       NotificationPublisherService notificationPublisherService) {
        this.loanApplicationRepository = loanApplicationRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.notificationPublisherService = notificationPublisherService;
    }

    @Transactional
    public LoanApplication applyLoan(String applicantUsername, LoanApplicationRequest request) {
        User user = userRepository.findByUsername(applicantUsername)
            .orElseThrow(() -> new IllegalArgumentException("Applicant not found"));
        if (!user.isActive() || user.getKycStatus() != KycStatus.VERIFIED) {
            throw new IllegalArgumentException("Loan applications require active, KYC-verified customers");
        }

        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        if (!account.getOwner().getUsername().equals(applicantUsername)) {
            throw new IllegalArgumentException("Account does not belong to applicant");
        }

        LoanApplication loan = new LoanApplication();
        loan.setApplicantUsername(applicantUsername);
        loan.setAccountNumber(request.getAccountNumber());
        loan.setLoanType(request.getLoanType());
        loan.setPrincipalAmount(request.getPrincipalAmount());
        loan.setTenureMonths(request.getTenureMonths());
        loan.setInterestRate(request.getInterestRate());

        BigDecimal totalPayable = calculateTotalPayable(request.getPrincipalAmount(), request.getInterestRate(), request.getTenureMonths());
        BigDecimal emiAmount = totalPayable.divide(BigDecimal.valueOf(request.getTenureMonths()), 2, RoundingMode.HALF_UP);

        loan.setTotalPayable(totalPayable);
        loan.setEmiAmount(emiAmount);
        loan.setRemainingBalance(totalPayable);
        loan.setStatus(LoanStatus.PENDING);
        return loanApplicationRepository.save(loan);
    }

    @Transactional(readOnly = true)
    public List<LoanApplication> listLoansForApplicant(String applicantUsername) {
        return loanApplicationRepository.findAllByApplicantUsername(applicantUsername);
    }

    @Transactional(readOnly = true)
    public List<LoanApplication> listPendingLoans() {
        return loanApplicationRepository.findAllByStatus(LoanStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<LoanApplication> listAllLoans() {
        return loanApplicationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public LoanSummaryResponse getLoanSummary() {
        List<LoanApplication> allLoans = loanApplicationRepository.findAll();
        long total = allLoans.size();
        long pending = allLoans.stream().filter(l -> l.getStatus() == LoanStatus.PENDING).count();
        long approved = allLoans.stream().filter(l -> l.getStatus() == LoanStatus.APPROVED).count();
        long rejected = allLoans.stream().filter(l -> l.getStatus() == LoanStatus.REJECTED).count();
        long delinquent = allLoans.stream().filter(l -> l.getStatus() == LoanStatus.DELINQUENT).count();
        var totalOutstanding = allLoans.stream()
            .map(LoanApplication::getRemainingBalance)
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        var totalDisbursed = allLoans.stream()
            .filter(l -> l.getStatus() == LoanStatus.APPROVED || l.getStatus() == LoanStatus.CLOSED || l.getStatus() == LoanStatus.DELINQUENT)
            .map(LoanApplication::getPrincipalAmount)
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        return new LoanSummaryResponse(total, pending, approved, rejected, delinquent, totalOutstanding, totalDisbursed);
    }

    @Transactional
    public LoanApplication approveLoan(Long loanId, String approverUsername) {
        LoanApplication loan = loanApplicationRepository.findById(loanId)
            .orElseThrow(() -> new IllegalArgumentException("Loan application not found"));
        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new IllegalArgumentException("Loan application cannot be approved");
        }

        Account account = accountRepository.findByAccountNumber(loan.getAccountNumber())
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        loan.setStatus(LoanStatus.APPROVED);
        loan.setApprovedAt(Instant.now());
        loan.setApprovedBy(approverUsername);
        loan.setNextEmiAt(LocalDate.now().plus(1, ChronoUnit.MONTHS).atStartOfDay().toInstant(ZoneOffset.UTC));

        account.setBalance(account.getBalance().add(loan.getPrincipalAmount()));
        accountRepository.save(account);

        notificationPublisherService.publish(new NotificationDto(
            UUID.randomUUID().toString(),
            loan.getApplicantUsername(),
            "LOAN",
            "Loan Approved",
            "Your loan application for ₹" + loan.getPrincipalAmount() + " has been approved.",
            Instant.now().toString()
        ));

        Transaction disbursement = new Transaction();
        disbursement.setFromAccount("BANK_LOAN_DISBURSEMENT");
        disbursement.setToAccount(account.getAccountNumber());
        disbursement.setAmount(loan.getPrincipalAmount());
        disbursement.setStatus("DISBURSED");
        disbursement.setIdempotencyKey(UUID.randomUUID().toString());
        disbursement.setCreatedBy(approverUsername);
        transactionRepository.save(disbursement);

        return loanApplicationRepository.save(loan);
    }

    @Transactional
    public LoanApplication rejectLoan(Long loanId, String approverUsername) {
        LoanApplication loan = loanApplicationRepository.findById(loanId)
            .orElseThrow(() -> new IllegalArgumentException("Loan application not found"));
        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new IllegalArgumentException("Loan application cannot be rejected");
        }

        loan.setStatus(LoanStatus.REJECTED);
        loan.setApprovedAt(Instant.now());
        loan.setApprovedBy(approverUsername);

        notificationPublisherService.publish(new NotificationDto(
            UUID.randomUUID().toString(),
            loan.getApplicantUsername(),
            "LOAN",
            "Loan Rejected",
            "Your loan application for ₹" + loan.getPrincipalAmount() + " has been rejected.",
            Instant.now().toString()
        ));

        return loanApplicationRepository.save(loan);
    }

    @Transactional
    public void executeLoanEmis() {
        Instant now = Instant.now();
        List<LoanApplication> loans = loanApplicationRepository.findAllByStatusAndNextEmiAtBefore(LoanStatus.APPROVED, now);
        for (LoanApplication loan : loans) {
            Account account = accountRepository.findByAccountNumber(loan.getAccountNumber())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

            if (account.getBalance().compareTo(loan.getEmiAmount()) < 0) {
                loan.setStatus(LoanStatus.DELINQUENT);
                loanApplicationRepository.save(loan);
                continue;
            }

            account.setBalance(account.getBalance().subtract(loan.getEmiAmount()));
            accountRepository.save(account);

            loan.setRemainingBalance(loan.getRemainingBalance().subtract(loan.getEmiAmount()));
            loan.setLastPaymentAt(now);
            loan.setNextEmiAt(LocalDate.ofInstant(loan.getNextEmiAt(), ZoneOffset.UTC).plus(1, ChronoUnit.MONTHS).atStartOfDay().toInstant(ZoneOffset.UTC));
            if (loan.getRemainingBalance().compareTo(BigDecimal.ZERO) <= 0) {
                loan.setStatus(LoanStatus.CLOSED);
                loan.setRemainingBalance(BigDecimal.ZERO);
            }

            Transaction repayment = new Transaction();
            repayment.setFromAccount(account.getAccountNumber());
            repayment.setToAccount("BANK_LOAN_REPAYMENT");
            repayment.setAmount(loan.getEmiAmount());
            repayment.setStatus("EMI_PAID");
            repayment.setIdempotencyKey(UUID.randomUUID().toString());
            repayment.setCreatedBy("scheduler");
            transactionRepository.save(repayment);

            loanApplicationRepository.save(loan);
        }
    }

    private BigDecimal calculateTotalPayable(BigDecimal principal, BigDecimal annualRate, int tenureMonths) {
        BigDecimal years = BigDecimal.valueOf(tenureMonths).divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP);
        BigDecimal interest = principal.multiply(annualRate).multiply(years).divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP);
        return principal.add(interest).setScale(2, RoundingMode.HALF_UP);
    }
}
