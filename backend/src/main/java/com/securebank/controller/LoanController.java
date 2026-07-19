package com.securebank.controller;

import com.securebank.dto.LoanApplicationRequest;
import com.securebank.dto.LoanApplicationResponse;
import com.securebank.dto.LoanSummaryResponse;
import com.securebank.entity.LoanApplication;
import com.securebank.entity.LoanStatus;
import com.securebank.service.LoanService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
public class LoanController {
    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @PostMapping("/apply")
    public ResponseEntity<LoanApplicationResponse> applyLoan(@RequestBody @Valid LoanApplicationRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        LoanApplication loan = loanService.applyLoan(username, request);
        return ResponseEntity.ok(mapToResponse(loan));
    }

    @GetMapping
    public ResponseEntity<List<LoanApplicationResponse>> listLoansForUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var loans = loanService.listLoansForApplicant(username);
        var results = loans.stream().map(this::mapToResponse).toList();
        return ResponseEntity.ok(results);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<List<LoanApplicationResponse>> listAllLoansForAdmin() {
        var loans = loanService.listAllLoans();
        var results = loans.stream().map(this::mapToResponse).toList();
        return ResponseEntity.ok(results);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/pending")
    public ResponseEntity<List<LoanApplicationResponse>> listPendingLoansForAdmin() {
        var loans = loanService.listPendingLoans();
        var results = loans.stream().map(this::mapToResponse).toList();
        return ResponseEntity.ok(results);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/summary")
    public ResponseEntity<LoanSummaryResponse> getLoanSummaryForAdmin() {
        return ResponseEntity.ok(loanService.getLoanSummary());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/{id}/approve")
    public ResponseEntity<LoanApplicationResponse> approveLoan(@PathVariable("id") Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var loan = loanService.approveLoan(id, username);
        return ResponseEntity.ok(mapToResponse(loan));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/{id}/reject")
    public ResponseEntity<LoanApplicationResponse> rejectLoan(@PathVariable("id") Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var loan = loanService.rejectLoan(id, username);
        return ResponseEntity.ok(mapToResponse(loan));
    }

    private LoanApplicationResponse mapToResponse(LoanApplication loan) {
        return new LoanApplicationResponse(
            loan.getId(),
            loan.getApplicantUsername(),
            loan.getAccountNumber(),
            loan.getLoanType(),
            loan.getPrincipalAmount(),
            loan.getTenureMonths(),
            loan.getInterestRate(),
            loan.getTotalPayable(),
            loan.getEmiAmount(),
            loan.getRemainingBalance(),
            loan.getStatus().name(),
            loan.getApprovedAt(),
            loan.getApprovedBy(),
            loan.getNextEmiAt(),
            loan.getLastPaymentAt()
        );
    }
}
