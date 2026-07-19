package com.securebank.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PaymentConfig {
    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    @Value("${stripe.api-key}")
    private String stripeApiKey;

    @Value("${stripe.endpoint-secret}")
    private String stripeEndpointSecret;

    public String getRazorpayKeyId() {
        return razorpayKeyId;
    }

    public String getRazorpayKeySecret() {
        return razorpayKeySecret;
    }

    public String getStripeApiKey() {
        return stripeApiKey;
    }

    public String getStripeEndpointSecret() {
        return stripeEndpointSecret;
    }
}
