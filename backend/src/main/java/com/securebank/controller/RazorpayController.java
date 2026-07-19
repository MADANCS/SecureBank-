package com.securebank.controller;

import com.razorpay.RazorpayException;
import com.securebank.dto.TransferRequest;
import com.securebank.entity.Transaction;
import com.securebank.service.RazorpayService;
import com.securebank.service.TransactionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/razorpay")
public class RazorpayController {

    private static final Logger log = LoggerFactory.getLogger(RazorpayController.class);

    private final RazorpayService razorpayService;
    private final TransactionService transactionService;

    public RazorpayController(RazorpayService razorpayService, TransactionService transactionService) {
        this.razorpayService = razorpayService;
        this.transactionService = transactionService;
    }

    /**
     * POST /api/razorpay/create-order
     * Body: { "amount": 500.00 }
     * Creates a Razorpay order and returns the order details needed to open the checkout modal.
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body,
                                          @AuthenticationPrincipal String username) {
        try {
            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            String receipt = "rcpt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            Map<String, Object> order = razorpayService.createOrder(amount, "INR", receipt);
            return ResponseEntity.ok(order);
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed. Key={}, Error={}",
                razorpayService.getMaskedKeyId(), e.getMessage(), e);
            // Signal the frontend that Razorpay is unavailable (invalid keys / network)
            // so it can offer a graceful fallback to direct transfer
            return ResponseEntity.status(503).body(Map.of(
                "razorpay_unavailable", true,
                "reason", "Razorpay order creation failed: " + e.getMessage(),
                "detail", e.getMessage()
            ));
        }
    }

    /**
     * POST /api/razorpay/verify-and-transfer
     * Body: {
     *   "razorpay_order_id": "order_xxx",
     *   "razorpay_payment_id": "pay_xxx",
     *   "razorpay_signature": "...",
     *   "fromAccount": "KAR-SAVA...",
     *   "toAccount": "KAR-CUR...",
     *   "amount": 500.00,
     *   "description": "Transfer to John"
     * }
     * Verifies signature and, if valid, executes the bank transfer.
     */
    @PostMapping("/verify-and-transfer")
    public ResponseEntity<?> verifyAndTransfer(@RequestBody Map<String, Object> body,
                                                @AuthenticationPrincipal String username) {
        String orderId    = body.get("razorpay_order_id").toString();
        String paymentId  = body.get("razorpay_payment_id").toString();
        String signature  = body.get("razorpay_signature").toString();

        // 1. Verify signature
        boolean valid = razorpayService.verifySignature(orderId, paymentId, signature);
        if (!valid) {
            return ResponseEntity.status(400).body(Map.of(
                "error", "Invalid payment signature. Payment could not be verified."
            ));
        }

        // 2. Execute the internal bank transfer
        try {
            TransferRequest req = new TransferRequest();
            req.setFromAccount(body.get("fromAccount").toString());
            req.setToAccount(body.get("toAccount").toString());
            req.setAmount(new BigDecimal(body.get("amount").toString()));
            req.setIdempotencyKey("rzp_" + paymentId); // Payment ID guarantees idempotency

            Transaction tx = transactionService.transfer(req, username);

            return ResponseEntity.ok(Map.of(
                "success",       true,
                "transactionId", tx.getId(),
                "status",        tx.getStatus(),
                "paymentId",     paymentId,
                "message",       "Payment verified and transfer initiated successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Payment verified but transfer failed: " + e.getMessage()
            ));
        }
    }
}
