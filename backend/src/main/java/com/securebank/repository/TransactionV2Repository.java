package com.securebank.repository;

import com.securebank.entity.TransactionV2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionV2Repository extends JpaRepository<TransactionV2, Long> {
    Page<TransactionV2> findByFromAccount(String fromAccount, Pageable pageable);
    Page<TransactionV2> findByToAccount(String toAccount, Pageable pageable);
    Page<TransactionV2> findByStatus(TransactionV2.TransactionStatus status, Pageable pageable);
}
