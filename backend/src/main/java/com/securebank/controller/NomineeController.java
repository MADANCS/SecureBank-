package com.securebank.controller;

import com.securebank.entity.Nominee;
import com.securebank.repository.AccountRepository;
import com.securebank.service.NomineeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/nominees")
public class NomineeController {

    private final NomineeService nomineeService;
    private final AccountRepository accountRepository;

    public NomineeController(NomineeService nomineeService, AccountRepository accountRepository) {
        this.nomineeService = nomineeService;
        this.accountRepository = accountRepository;
    }

    @GetMapping("/{accountNumber}")
    public ResponseEntity<List<Nominee>> getNominees(
            Authentication auth, @PathVariable String accountNumber) {
        validateOwnership(auth.getName(), accountNumber);
        return ResponseEntity.ok(nomineeService.getNominees(accountNumber));
    }

    @PostMapping("/{accountNumber}")
    public ResponseEntity<Map<String, Object>> addNominee(
            Authentication auth,
            @PathVariable String accountNumber,
            @RequestBody Map<String, Object> body) {
        validateOwnership(auth.getName(), accountNumber);
        Nominee nominee = nomineeService.addNominee(
                accountNumber,
                (String) body.get("nomineeName"),
                (String) body.get("relationship"),
                (String) body.get("dateOfBirth"),
                (String) body.get("phone"),
                (String) body.get("email"),
                Integer.parseInt(body.getOrDefault("sharePercentage", "100").toString()),
                auth.getName()
        );
        return ResponseEntity.ok(Map.of("success", true, "message", "Nominee added", "nominee", nominee));
    }

    @PutMapping("/{accountNumber}/{nomineeId}")
    public ResponseEntity<Map<String, Object>> updateNominee(
            Authentication auth,
            @PathVariable String accountNumber,
            @PathVariable Long nomineeId,
            @RequestBody Map<String, Object> body) {
        validateOwnership(auth.getName(), accountNumber);
        Nominee nominee = nomineeService.updateNominee(
                nomineeId, accountNumber,
                (String) body.get("nomineeName"),
                (String) body.get("relationship"),
                (String) body.get("dateOfBirth"),
                (String) body.get("phone"),
                (String) body.get("email"),
                Integer.parseInt(body.getOrDefault("sharePercentage", "100").toString())
        );
        return ResponseEntity.ok(Map.of("success", true, "message", "Nominee updated", "nominee", nominee));
    }

    @DeleteMapping("/{accountNumber}/{nomineeId}")
    public ResponseEntity<Map<String, Object>> removeNominee(
            Authentication auth,
            @PathVariable String accountNumber,
            @PathVariable Long nomineeId) {
        validateOwnership(auth.getName(), accountNumber);
        nomineeService.removeNominee(nomineeId, accountNumber);
        return ResponseEntity.ok(Map.of("success", true, "message", "Nominee removed"));
    }

    private void validateOwnership(String username, String accountNumber) {
        accountRepository.findByAccountNumber(accountNumber).ifPresentOrElse(
            acc -> {
                if (!acc.getOwner().getUsername().equals(username)) {
                    throw new org.springframework.security.access.AccessDeniedException("Account does not belong to you");
                }
            },
            () -> { throw new IllegalArgumentException("Account not found"); }
        );
    }
}
