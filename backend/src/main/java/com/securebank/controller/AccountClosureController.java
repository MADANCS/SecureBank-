package com.securebank.controller;

import com.securebank.entity.AccountClosureRequest;
import com.securebank.service.AccountClosureService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/account-closure")
public class AccountClosureController {

    private final AccountClosureService closureService;

    public AccountClosureController(AccountClosureService closureService) {
        this.closureService = closureService;
    }

    /** User: request closure of their account */
    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> requestClosure(
            Authentication auth, @RequestBody Map<String, String> body) {
        try {
            AccountClosureRequest req = closureService.requestClosure(
                    body.get("accountNumber"), auth.getName(), body.get("reason"));
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Closure request submitted. Admin review pending.",
                    "requestId", req.getId(),
                    "status", req.getStatus()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** User: view their closure requests */
    @GetMapping("/my-requests")
    public ResponseEntity<List<AccountClosureRequest>> myRequests(Authentication auth) {
        return ResponseEntity.ok(closureService.getUserRequests(auth.getName()));
    }

    /** Admin: list all pending closure requests */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AccountClosureRequest>> pendingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(closureService.getPendingRequests(PageRequest.of(page, size)));
    }

    /** Admin: list all closure requests */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AccountClosureRequest>> allRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(closureService.getAllRequests(PageRequest.of(page, size)));
    }

    /** Admin: approve or reject a closure request */
    @PostMapping("/{requestId}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> reviewRequest(
            Authentication auth,
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> body) {
        boolean approve = Boolean.parseBoolean(body.getOrDefault("approve", "false").toString());
        String note = (String) body.getOrDefault("note", "");
        AccountClosureRequest req = closureService.reviewRequest(requestId, approve, auth.getName(), note);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", approve ? "Account closure completed" : "Closure request rejected",
                "status", req.getStatus()
        ));
    }
}
