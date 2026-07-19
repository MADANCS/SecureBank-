package com.securebank.service;

import com.securebank.config.PaymentConfig;
import com.securebank.dto.NotificationDto;
import com.securebank.dto.PaymentRequest;
import com.securebank.dto.PaymentResponse;
import com.securebank.entity.Account;
import com.securebank.entity.PaymentOrder;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.PaymentOrderRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentService {
    private final AccountRepository accountRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final PaymentConfig paymentConfig;
    private final NotificationPublisherService notificationPublisherService;

    public PaymentService(AccountRepository accountRepository,
                          PaymentOrderRepository paymentOrderRepository,
                          PaymentConfig paymentConfig,
                          NotificationPublisherService notificationPublisherService) {
        this.accountRepository = accountRepository;
        this.paymentOrderRepository = paymentOrderRepository;
        this.paymentConfig = paymentConfig;
        this.notificationPublisherService = notificationPublisherService;
    }

    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        if (account.getBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalArgumentException("Insufficient balance for bill payment");
        }

        account.setBalance(account.getBalance().subtract(request.getAmount()));
        accountRepository.save(account);

        PaymentOrder order = new PaymentOrder();
        order.setAccountNumber(request.getAccountNumber());
        order.setBillType(request.getBillType());
        order.setReference(request.getReference());
        order.setAmount(request.getAmount());
        order.setStatus("SETTLED");
        order.setProvider("INTERNAL");
        paymentOrderRepository.save(order);

        notificationPublisherService.publish(new NotificationDto(
            UUID.randomUUID().toString(),
            account.getOwner().getUsername(),
            "PAYMENT",
            "Payment Completed",
            "Your bill payment of ₹" + request.getAmount() + " has been settled successfully.",
            Instant.now().toString()
        ));

        return new PaymentResponse(UUID.randomUUID().toString(), "SETTLED", "Payment executed successfully");
    }

    public PaymentResponse createRazorpayOrder(String accountNumber, BigDecimal amount, String currency) {
        return new PaymentResponse("razorpay-disabled", "UNSUPPORTED", "Razorpay integration is disabled in this build");
    }

    public PaymentResponse createStripeCheckoutSession(String accountNumber, BigDecimal amount, String currency, String successUrl, String cancelUrl) throws StripeException {
        Account account = accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        Stripe.apiKey = paymentConfig.getStripeApiKey();
        Map<String, Object> params = new HashMap<>();
        params.put("payment_method_types", java.util.List.of("card"));
        params.put("mode", "payment");
        params.put("success_url", successUrl);
        params.put("cancel_url", cancelUrl);

        Map<String, Object> lineItem = new HashMap<>();
        lineItem.put("name", "SecureBank Payment");
        lineItem.put("description", "Invoice for account " + accountNumber);
        lineItem.put("amount", amount.multiply(BigDecimal.valueOf(100)).longValue());
        lineItem.put("currency", currency.toLowerCase());
        lineItem.put("quantity", 1);
        params.put("line_items", java.util.List.of(lineItem));

        Session session = Session.create(params);

        PaymentOrder paymentOrder = new PaymentOrder();
        paymentOrder.setAccountNumber(accountNumber);
        paymentOrder.setBillType("STRIPE_CHECKOUT");
        paymentOrder.setReference(session.getId());
        paymentOrder.setAmount(amount);
        paymentOrder.setProvider("STRIPE");
        paymentOrder.setExternalId(session.getId());
        paymentOrder.setCurrency(currency);
        paymentOrder.setStatus("PENDING");
        paymentOrderRepository.save(paymentOrder);

        PaymentResponse response = new PaymentResponse(session.getId(), "PENDING", "Stripe checkout session created");
        response.setReferenceId(session.getId());
        response.setProvider("STRIPE");
        response.setClientSecret(session.getUrl());
        return response;
    }

    @Transactional
    public void processRazorpayWebhook(String payload, String signature) {
        // Razorpay webhook processing is disabled in this build.
    }

    @Transactional
    public void processStripeWebhook(String payload, String signature) {
        try {
            Event event = Webhook.constructEvent(payload, signature, paymentConfig.getStripeEndpointSecret());
            if ("checkout.session.completed".equals(event.getType())) {
                Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
                if (session != null) {
                    paymentOrderRepository.findAll().stream()
                        .filter(order -> session.getId().equals(order.getExternalId()))
                        .findFirst()
                        .ifPresent(order -> {
                            order.setStatus("SETTLED");
                            paymentOrderRepository.save(order);
                            accountRepository.findByAccountNumber(order.getAccountNumber())
                                .ifPresent(account -> notificationPublisherService.publish(new NotificationDto(
                                    UUID.randomUUID().toString(),
                                    account.getOwner().getUsername(),
                                    "PAYMENT",
                                    "Stripe Payment Settled",
                                    "Your Stripe payment of ₹" + order.getAmount() + " has been settled successfully.",
                                    Instant.now().toString()
                                )));
                        });
                }
            }
        } catch (SignatureVerificationException ex) {
            throw new IllegalArgumentException("Stripe webhook signature failed", ex);
        }
    }

}
