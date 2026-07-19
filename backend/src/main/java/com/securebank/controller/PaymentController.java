package com.securebank.controller;

import com.securebank.dto.PaymentRequest;
import com.securebank.dto.PaymentResponse;
import com.securebank.dto.RecurringPaymentRequest;
import com.securebank.dto.RecurringPaymentResponse;
import com.securebank.entity.PaymentOrder;
import com.securebank.repository.PaymentOrderRepository;
import com.securebank.service.PaymentService;
import com.securebank.service.RecurringPaymentService;
import com.stripe.exception.StripeException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;
    private final RecurringPaymentService recurringPaymentService;
    private final PaymentOrderRepository paymentOrderRepository;

    public PaymentController(PaymentService paymentService,
                             RecurringPaymentService recurringPaymentService,
                             PaymentOrderRepository paymentOrderRepository) {
        this.paymentService = paymentService;
        this.recurringPaymentService = recurringPaymentService;
        this.paymentOrderRepository = paymentOrderRepository;
    }

    @PostMapping("/bill")
    public ResponseEntity<PaymentResponse> payBill(@RequestBody @Valid PaymentRequest request) {
        return ResponseEntity.ok(paymentService.createPayment(request));
    }

    /**
     * GET /payments/history?accountNumber=...&page=0&size=10
     * Returns paginated payment order history for the given account.
     * Frontend paymentService.getPayments() calls this endpoint.
     */
    @GetMapping("/history")
    public ResponseEntity<Page<Map<String, Object>>> getPaymentHistory(
            @RequestParam String accountNumber,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<PaymentOrder> orders = paymentOrderRepository
            .findByAccountNumberOrderByCreatedAtDesc(accountNumber, PageRequest.of(page, size));
        Page<Map<String, Object>> result = orders.map(o -> {
            java.util.LinkedHashMap<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id",            o.getId());
            m.put("payerAccount",  o.getAccountNumber());
            m.put("payeeAccount",  o.getReference());
            m.put("method",        o.getBillType());
            m.put("amount",        o.getAmount());
            m.put("status",        o.getStatus());
            m.put("reference",     o.getExternalId());
            m.put("createdAt",     o.getCreatedAt());
            return (Map<String, Object>) m;
        });
        return ResponseEntity.ok(result);
    }

    @PostMapping("/razorpay/order")
    public ResponseEntity<PaymentResponse> createRazorpayOrder(@RequestParam String accountNumber,
                                                               @RequestParam String amount,
                                                               @RequestParam(defaultValue = "INR") String currency) {
        return ResponseEntity.ok(paymentService.createRazorpayOrder(accountNumber, new java.math.BigDecimal(amount), currency));
    }

    @PostMapping(path = "/razorpay/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> razorpayWebhook(@RequestHeader("X-Razorpay-Signature") String signature,
                                                  @RequestBody String payload) {
        paymentService.processRazorpayWebhook(payload, signature);
        return ResponseEntity.ok("Webhook processed");
    }

    @PostMapping("/stripe/intent")
    public ResponseEntity<PaymentResponse> createStripeIntent(@RequestParam String accountNumber,
                                                              @RequestParam String amount,
                                                              @RequestParam(defaultValue = "INR") String currency,
                                                              @RequestParam String successUrl,
                                                              @RequestParam String cancelUrl) throws StripeException {
        return ResponseEntity.ok(paymentService.createStripeCheckoutSession(accountNumber, new java.math.BigDecimal(amount), currency, successUrl, cancelUrl));
    }

    @PostMapping("/recurring")
    public ResponseEntity<RecurringPaymentResponse> scheduleRecurringPayment(@RequestBody @Valid RecurringPaymentRequest request) {
        var recurringPayment = recurringPaymentService.createRecurringPayment(request);
        var response = new RecurringPaymentResponse(
            recurringPayment.getId(),
            recurringPayment.getAccountNumber(),
            recurringPayment.getBillType(),
            recurringPayment.getReference(),
            recurringPayment.getAmount(),
            recurringPayment.getFrequency(),
            recurringPayment.getNextExecutionAt(),
            recurringPayment.isEnabled(),
            recurringPayment.getStatus(),
            recurringPayment.getLastExecutedAt(),
            recurringPayment.getLastExecutionStatus()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/recurring")
    public ResponseEntity<List<RecurringPaymentResponse>> getRecurringPayments(@RequestParam String accountNumber) {
        var recurringPayments = recurringPaymentService.listRecurringPayments(accountNumber);
        var responseList = recurringPayments.stream().map(payment -> new RecurringPaymentResponse(
            payment.getId(),
            payment.getAccountNumber(),
            payment.getBillType(),
            payment.getReference(),
            payment.getAmount(),
            payment.getFrequency(),
            payment.getNextExecutionAt(),
            payment.isEnabled(),
            payment.getStatus(),
            payment.getLastExecutedAt(),
            payment.getLastExecutionStatus()
        )).toList();
        return ResponseEntity.ok(responseList);
    }

    @DeleteMapping("/recurring/{id}")
    public ResponseEntity<Void> cancelRecurringPayment(@PathVariable("id") String id) {
        recurringPaymentService.cancelRecurringPayment(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping(path = "/stripe/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> stripeWebhook(@RequestHeader("Stripe-Signature") String signature,
                                                @RequestBody String payload) {
        paymentService.processStripeWebhook(payload, signature);
        return ResponseEntity.ok("Stripe webhook processed");
    }
}
