package com.securebank.dto;

import java.time.Instant;

public class AuditLogResponse {
    private Long id;
    private String username;
    private String action;
    private String details;
    private String ipAddress;
    private String userAgent;
    private Instant timestamp;
    private String correlationId;

    public AuditLogResponse(Long id, String username, String action, String details, 
                           String ipAddress, String userAgent, Instant timestamp, String correlationId) {
        this.id = id;
        this.username = username;
        this.action = action;
        this.details = details;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.timestamp = timestamp;
        this.correlationId = correlationId;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getAction() { return action; }
    public String getDetails() { return details; }
    public String getIpAddress() { return ipAddress; }
    public String getUserAgent() { return userAgent; }
    public Instant getTimestamp() { return timestamp; }
    public String getCorrelationId() { return correlationId; }
}
