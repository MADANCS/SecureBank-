package com.securebank.controller.v1;

import com.securebank.dto.AuditLogResponse;
import com.securebank.entity.AuditLog;
import com.securebank.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {
    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<Page<AuditLogResponse>> getAllAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logs;

        if (username != null && !username.isBlank()) {
            logs = auditLogService.getAuditLogsByUsername(username, pageable);
        } else if (action != null && !action.isBlank()) {
            logs = auditLogService.getAuditLogsByAction(action, pageable);
        } else {
            logs = auditLogService.getAuditLogs(pageable);
        }

        Page<AuditLogResponse> response = new PageImpl<>(
            logs.getContent().stream()
                .map(log -> new AuditLogResponse(
                    log.getId(), log.getUsername(), log.getAction(), log.getDetails(),
                    log.getIpAddress(), log.getUserAgent(), log.getTimestamp(), log.getCorrelationId()
                ))
                .collect(Collectors.toList()),
            pageable,
            logs.getTotalElements()
        );

        return ResponseEntity.ok(response);
    }
}
