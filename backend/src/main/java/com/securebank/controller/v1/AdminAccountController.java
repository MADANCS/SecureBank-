package com.securebank.controller.v1;

import com.securebank.service.AccountFreezeService;
import com.securebank.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/accounts")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAccountController {
    private final AccountFreezeService accountFreezeService;
    private final AuditLogService auditLogService;

    public AdminAccountController(AccountFreezeService accountFreezeService, AuditLogService auditLogService) {
        this.accountFreezeService = accountFreezeService;
        this.auditLogService = auditLogService;
    }

    @PostMapping("/{accountNumber}/freeze")
    public ResponseEntity<String> freezeAccount(
            @PathVariable("accountNumber") String accountNumber,
            @RequestParam("reason") String reason,
            @AuthenticationPrincipal String admin,
            HttpServletRequest request) {
        accountFreezeService.freezeAccount(accountNumber, admin, reason);
        auditLogService.log(admin, "ACCOUNT_FROZEN", "Froze account: " + accountNumber + ", Reason: " + reason, request);
        return ResponseEntity.ok("Account frozen successfully");
    }

    @PostMapping("/{accountNumber}/unfreeze")
    public ResponseEntity<String> unfreezeAccount(
            @PathVariable("accountNumber") String accountNumber,
            @AuthenticationPrincipal String admin,
            HttpServletRequest request) {
        accountFreezeService.unfreezeAccount(accountNumber, admin);
        auditLogService.log(admin, "ACCOUNT_UNFROZEN", "Unfroze account: " + accountNumber, request);
        return ResponseEntity.ok("Account unfrozen successfully");
    }

    @GetMapping("/{accountNumber}/freeze-status")
    public ResponseEntity<Boolean> getAccountFreezeStatus(@PathVariable("accountNumber") String accountNumber) {
        boolean frozen = accountFreezeService.isAccountFrozen(accountNumber);
        return ResponseEntity.ok(frozen);
    }
}
