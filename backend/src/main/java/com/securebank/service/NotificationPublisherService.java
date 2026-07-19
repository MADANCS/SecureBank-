package com.securebank.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securebank.dto.NotificationDto;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;

@Service
public class NotificationPublisherService {
    private final StringRedisTemplate redisTemplate;
    private final ChannelTopic notificationTopic;
    private final ObjectMapper objectMapper;
    private final NotificationEmitterService emitterService;

    public NotificationPublisherService(StringRedisTemplate redisTemplate,
                                        ChannelTopic notificationTopic,
                                        ObjectMapper objectMapper,
                                        NotificationEmitterService emitterService) {
        this.redisTemplate = redisTemplate;
        this.notificationTopic = notificationTopic;
        this.objectMapper = objectMapper;
        this.emitterService = emitterService;
    }

    public void publish(NotificationDto notification) {
        emitterService.sendNotification(notification);
        try {
            redisTemplate.convertAndSend(notificationTopic.getTopic(), objectMapper.writeValueAsString(notification));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Unable to serialize notification", ex);
        } catch (Exception ex) {
            // If Redis is unavailable, continue delivering local notifications.
        }
    }
}
