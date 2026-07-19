package com.securebank.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access.expiration-ms:900000}")
    private long accessTokenExpiresIn;

    @Value("${jwt.refresh.expiration-ms:604800000}")
    private long refreshTokenExpiresIn;

    public String getSecret() {
        return secret;
    }

    public long getAccessTokenExpiresIn() {
        return accessTokenExpiresIn;
    }

    public long getRefreshTokenExpiresIn() {
        return refreshTokenExpiresIn;
    }
}
