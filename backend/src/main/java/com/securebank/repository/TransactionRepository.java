package com.securebank.repository;

import com.securebank.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {
    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);
    Page<Transaction> findAllByFromAccountOrToAccount(String fromAccount, String toAccount, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.fromAccount IN :accountNumbers " +
           "AND t.status IN ('COMPLETED', 'PROCESSING', 'PENDING') " +
           "AND t.createdAt >= :since")
    BigDecimal sumOutgoingFromAccounts(@org.springframework.data.repository.query.Param("accountNumbers") List<String> accountNumbers, 
                                       @org.springframework.data.repository.query.Param("since") Instant since);

    long countByStatus(String status);
    long countByCreatedAtAfter(Instant since);
}

