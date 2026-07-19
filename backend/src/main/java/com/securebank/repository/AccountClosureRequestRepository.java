package com.securebank.repository;

import com.securebank.entity.AccountClosureRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AccountClosureRequestRepository extends JpaRepository<AccountClosureRequest, Long> {
    Optional<AccountClosureRequest> findByAccountNumberAndStatus(String accountNumber, AccountClosureRequest.ClosureStatus status);
    List<AccountClosureRequest> findByRequestedByOrderByRequestedAtDesc(String requestedBy);
    Page<AccountClosureRequest> findByStatusOrderByRequestedAtDesc(AccountClosureRequest.ClosureStatus status, Pageable pageable);
    Page<AccountClosureRequest> findAllByOrderByRequestedAtDesc(Pageable pageable);
}
