package com.securebank.dto;

public class NotificationDto {
    private String id;
    private String username;
    private String type;
    private String title;
    private String message;
    private String timestamp;

    public NotificationDto() {
    }

    public NotificationDto(String id, String username, String type, String title, String message, String timestamp) {
        this.id = id;
        this.username = username;
        this.type = type;
        this.title = title;
        this.message = message;
        this.timestamp = timestamp;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
