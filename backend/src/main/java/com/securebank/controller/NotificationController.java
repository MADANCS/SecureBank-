package com.securebank.controller;

import com.securebank.service.NotificationEmitterService;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationEmitterService emitterService;

    public NotificationController(NotificationEmitterService emitterService) {
        this.emitterService = emitterService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(@AuthenticationPrincipal String username) {
        SseEmitter emitter = emitterService.createEmitter(username);
        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
        } catch (IOException ignored) {
            // best-effort connected event
        }
        return emitter;
    }
}
