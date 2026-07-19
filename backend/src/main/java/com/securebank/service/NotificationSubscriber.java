package com.securebank.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.securebank.dto.NotificationDto;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class NotificationSubscriber implements MessageListener {
    private final NotificationEmitterService emitterService;
    private final ObjectMapper objectMapper;

    public NotificationSubscriber(NotificationEmitterService emitterService, ObjectMapper objectMapper) {
        this.emitterService = emitterService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String payload = new String(message.getBody(), StandardCharsets.UTF_8);
            NotificationDto notification = objectMapper.readValue(payload, NotificationDto.class);
            emitterService.sendNotification(notification);
        } catch (Exception ex) {
            // ignore invalid notification payloads
        }
    }
}
