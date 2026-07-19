package com.securebank.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class AdminIpWhitelistFilter extends OncePerRequestFilter {

    @Value("${app.security.admin-ip-whitelist:127.0.0.1,0:0:0:0:0:0:0:1}")
    private String allowedIpsProperty;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Only enforce IP whitelisting for admin routes
        if (path.startsWith("/api/v1/admin") || path.startsWith("/api/admin")) {
            List<String> allowedIps = Arrays.asList(allowedIpsProperty.split(","));
            String clientIp = getClientIp(request);

            if (!allowedIps.contains(clientIp)) {
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.getWriter().write("Access Denied: Your IP address (" + clientIp + ") is not whitelisted for the Admin Panel.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
