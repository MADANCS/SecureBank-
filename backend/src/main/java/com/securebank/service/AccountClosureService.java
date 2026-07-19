package com.securebank.service;

import com.securebank.entity.Account;
import com.securebank.entity.AccountClosureRequest;
import com.securebank.repository.AccountClosureRequestRepository;
import com.securebank.repository.AccountRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AccountClosureService {

    private final AccountClosureRequestRepository closureRepository;
    private final AccountRepository accountRepository;

    public AccountClosureService(AccountClosureRequestRepository closureRepository,
                                 AccountRepository accountRepository) {
        this.closureRepository = closureRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public AccountClosureRequest requestClosure(String accountNumber, String requestedBy, String reason) {
        // Prevent duplicate pending requests
        closureRepository.findByAccountNumberAndStatus(accountNumber, AccountClosureRequest.ClosureStatus.PENDING)
                .ifPresent(r -> { throw new IllegalArgumentException("A closure request is already pending for this account"); });

        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (account.getBalance().compareTo(java.math.BigDecimal.ZERO) != 0) {
            throw new IllegalArgumentException("Account balance must be zero before closure. Current balance: " + account.getBalance());
        }

        AccountClosureRequest req = new AccountClosureRequest();
        req.setAccountNumber(accountNumber);
        req.setRequestedBy(requestedBy);
        req.setReason(reason);
        req.setStatus(AccountClosureRequest.ClosureStatus.PENDING);
        return closureRepository.save(req);
    }

    public List<AccountClosureRequest> getUserRequests(String username) {
        return closureRepository.findByRequestedByOrderByRequestedAtDesc(username);
    }

    public Page<AccountClosureRequest> getPendingRequests(Pageable pageable) {
        return closureRepository.findByStatusOrderByRequestedAtDesc(AccountClosureRequest.ClosureStatus.PENDING, pageable);
    }

    public Page<AccountClosureRequest> getAllRequests(Pageable pageable) {
        return closureRepository.findAllByOrderByRequestedAtDesc(pageable);
    }

    @Transactional
    public AccountClosureRequest reviewRequest(Long requestId, boolean approve, String adminUsername, String note) {
        AccountClosureRequest req = closureRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (req.getStatus() != AccountClosureRequest.ClosureStatus.PENDING) {
            throw new IllegalArgumentException("Request has already been reviewed");
        }

        req.setReviewedBy(adminUsername);
        req.setReviewedAt(Instant.now());
        req.setReviewNote(note);

        if (approve) {
            req.setStatus(AccountClosureRequest.ClosureStatus.APPROVED);
            // Soft-close the account
            accountRepository.findByAccountNumber(req.getAccountNumber()).ifPresent(acc -> {
                acc.setActive(false);
                acc.setDeletedAt(Instant.now());
                accountRepository.save(acc);
            });
            req.setStatus(AccountClosureRequest.ClosureStatus.COMPLETED);
        } else {
            req.setStatus(AccountClosureRequest.ClosureStatus.REJECTED);
        }

        return closureRepository.save(req);
    }
}
