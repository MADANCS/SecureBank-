package com.securebank.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;

@Service
public class RazorpayService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayService.class);

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    // Lazily initialized singleton client
    private RazorpayClient client;

    private synchronized RazorpayClient getClient() throws RazorpayException {
        if (client == null) {
            log.info("Initializing RazorpayClient with key: {}", getMaskedKeyId());
            client = new RazorpayClient(keyId, keySecret);
        }
        return client;
    }

    public String getMaskedKeyId() {
        if (keyId == null || keyId.length() < 8) return "***";
        return keyId.substring(0, 8) + "..." + keyId.substring(keyId.length() - 4);
    }

    /**
     * Create a Razorpay order for the given amount (in INR).
     * Razorpay requires amount in paise (1 INR = 100 paise).
     */
    public Map<String, Object> createOrder(BigDecimal amount, String currency, String receipt) throws RazorpayException {
        RazorpayClient rzpClient = getClient();

        JSONObject options = new JSONObject();
        options.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue()); // paise
        options.put("currency", currency != null ? currency : "INR");
        options.put("receipt", receipt);
        options.put("payment_capture", 1); // auto-capture

        log.info("Creating Razorpay order: amount={}paise currency={} receipt={}",
            amount.multiply(BigDecimal.valueOf(100)).intValue(), currency, receipt);

        Order order = rzpClient.orders.create(options);
        JSONObject obj = order.toJson();

        return Map.of(
            "orderId",   obj.getString("id"),
            "amount",    obj.getInt("amount"),
            "currency",  obj.getString("currency"),
            "receipt",   obj.optString("receipt", receipt),
            "keyId",     keyId
        );
    }

    /**
     * Verify the Razorpay payment signature to ensure the payment is authentic.
     * Signature = HMAC-SHA256(orderId + "|" + paymentId, keySecret)
     */
    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String generated = HexFormat.of().formatHex(hash);
            return generated.equals(signature);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Signature verification failed", e);
        }
    }
}
