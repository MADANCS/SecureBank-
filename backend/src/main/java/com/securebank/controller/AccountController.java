package com.securebank.controller;

import com.securebank.entity.Account;
import com.securebank.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<List<Account>> listAccounts(@AuthenticationPrincipal String username) {
        return ResponseEntity.ok(accountService.getAccountsForUser(username));
    }

    @PostMapping
    public ResponseEntity<Account> createAccount(@AuthenticationPrincipal String username,
                                                 @RequestParam String accountType) {
        return ResponseEntity.ok(accountService.createAccount(username, accountType));
    }

    @PostMapping("/{accountNumber}/deposit")
    public ResponseEntity<Account> depositFunds(@PathVariable("accountNumber") String accountNumber,
                                                @RequestParam("amount") BigDecimal amount,
                                                @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(accountService.depositFunds(accountNumber, amount, username));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/create")
    public ResponseEntity<Account> adminCreateAccount(@RequestParam("username") String targetUsername,
                                                      @RequestParam("accountType") String accountType) {
        return ResponseEntity.ok(accountService.createAccount(targetUsername, accountType));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/{accountNumber}/deposit")
    public ResponseEntity<Account> adminDepositFunds(@PathVariable("accountNumber") String accountNumber,
                                                     @RequestParam("amount") BigDecimal amount,
                                                     @AuthenticationPrincipal String adminUsername) {
        return ResponseEntity.ok(accountService.adminDepositFunds(accountNumber, amount, adminUsername));
    }

    /**
     * Provision: create a new account for a user and optionally fund it in one atomic request.
     * POST /api/accounts/admin/provision?username=X&accountType=SAVINGS&initialDeposit=5000
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/provision")
    public ResponseEntity<java.util.Map<String, Object>> adminProvisionAccount(
            @RequestParam("username") String username,
            @RequestParam("accountType") String accountType,
            @RequestParam(value = "initialDeposit", defaultValue = "0") java.math.BigDecimal initialDeposit,
            @AuthenticationPrincipal String adminUsername) {
        return ResponseEntity.ok(accountService.adminProvisionAccount(username, accountType, initialDeposit, adminUsername));
    }
}
