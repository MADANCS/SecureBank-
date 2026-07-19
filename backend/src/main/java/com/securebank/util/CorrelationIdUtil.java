package com.securebank.util;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CorrelationIdUtil {
    private static final ThreadLocal<String> correlationId = new ThreadLocal<>();

    public static String generateCorrelationId() {
        String id = UUID.randomUUID().toString();
        correlationId.set(id);
        return id;
    }

    public static String getCorrelationId() {
        String id = correlationId.get();
        if (id == null) {
            id = generateCorrelationId();
        }
        return id;
    }

    public static void setCorrelationId(String id) {
        correlationId.set(id);
    }

    public static void clear() {
        correlationId.remove();
    }
}
